'use strict';

const { Decimal } = require('decimal.js');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const txsDAL = require('../../../server/components/api/txs/txsDAL');
const outputsDAL = require('../../../server/components/api/outputs/outputsDAL');
const inputsDAL = require('../../../server/components/api/inputs/inputsDAL');
const infosDAL = require('../../../server/components/api/infos/infosDAL');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const logger = require('../../lib/logger')('blocks');
const getJobData = require('../../lib/getJobData');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');
const addressesDAL = require('../../../server/components/api/addresses/addressesDAL');
const addressTxsDAL = require('../../../server/components/api/address-txs/addressTxsDAL');
const assetTxsDAL = require('../../../server/components/api/asset-txs/assetTxsDAL');
const assetsDAL = require('../../../server/components/api/assets/assetsDAL');
const calcRewardByHeight = require('../../../server/lib/calcRewardByHeight');

const Op = db.Sequelize.Op;

class BlocksAdder {
  constructor(networkHelper, blockchainParser, genesisTotalZp) {
    this.networkHelper = networkHelper;
    this.blockchainParser = blockchainParser;
    this.genesisTotalZp = genesisTotalZp;
    this.dbTransaction = null;
    this.job = null;
  }

  /**
   * Entry point: add blocks
   */
  async doJob(job) {
    this.job = job;
    const startTime = process.hrtime();
    try {
      const latestBlockInDB = await blocksDAL.findLatest();
      const latestBlockNumberInDB = (latestBlockInDB || {}).blockNumber || 0;
      const latestBlockNumberInNode = await this.networkHelper.getLatestBlockNumberFromNode();
      const latestBlockNumberToAdd = getJobData(job, 'limitBlocks')
        ? Math.min(
            latestBlockNumberInDB + Number(getJobData(job, 'limitBlocks')),
            latestBlockNumberInNode
          )
        : latestBlockNumberInNode;

      logger.info(
        `latestBlockNumberInDB=${latestBlockNumberInDB}, latestBlockNumberToAdd=${latestBlockNumberToAdd}`
      );

      const blocks = [];

      if (latestBlockNumberToAdd > latestBlockNumberInDB) {
        await this.setSyncingStatus({ syncing: 'syncing' });

        this.dbTransaction = await db.sequelize.transaction();

        for (
          let blockNumber = latestBlockNumberInDB + 1;
          blockNumber <= latestBlockNumberToAdd;
          blockNumber++
        ) {
          const nodeBlock = await this.networkHelper
            .getBlockFromNode(blockNumber)
            .then((block) =>
              Object.assign(block, { reward: calcRewardByHeight(block.header.blockNumber) })
            );

          logger.info(`Got block #${nodeBlock.header.blockNumber} from NODE...`);
          blocks.push(await this.addBlock({ nodeBlock }));
        }

        logger.info('Commit the database transaction');
        await this.dbTransaction.commit();
      } else {
        await this.setSyncingStatus({ syncing: 'synced' });
      }

      const hrEnd = process.hrtime(startTime);
      logger.info(`AddNewBlocks Finished. Time elapsed = ${hrEnd[0]}s ${hrEnd[1] / 1000000}ms`);
      // return the number of blocks added and the latest block number
      return {
        count: blocks.length,
        latest: blocks.reduce((max, cur) => (max < cur.blockNumber ? cur.blockNumber : max), 0),
      };
    } catch (error) {
      logger.error(`An Error has occurred when adding blocks: ${error.message}`);
      if (this.dbTransaction) {
        logger.info('Rollback the database transaction');
        await this.dbTransaction.rollback();
      }
      await this.setSyncingStatus({ syncing: 'error' });
      throw new QueueError(error);
    }
  }

  async setSyncingStatus({ syncing = 'synced' } = {}) {
    const name = 'syncing';
    const info = await infosDAL.findByName(name);
    if (info) {
      await infosDAL.update(info.id, {
        value: syncing,
      });
    } else {
      await infosDAL.create({
        name,
        value: syncing,
      });
    }
  }

  async addBlock({ nodeBlock } = {}) {
    const startTime = process.hrtime();
    if (await this.isReorg({ nodeBlock })) {
      throw new Error('Reorg');
    }
    const block = await this.createBlock({ nodeBlock });
    logger.info(`Block #${block.blockNumber} created. hash=${block.hash}`);
    const skipTransactions = getJobData(this.job, 'skipTransactions'); // for tests
    if (!skipTransactions) {
      // transactions
      const txHashes = Object.keys(nodeBlock.transactions);
      const txsToAdd = getJobData(this.job, 'limitTransactions')
        ? Math.min(getJobData(this.job, 'limitTransactions'), txHashes.length)
        : txHashes.length;
      for (let txIndex = 0; txIndex < txsToAdd; txIndex++) {
        const txHash = txHashes[txIndex];
        const nodeTx = nodeBlock.transactions[txHash];
        const tx = await this.addTxToBlock({
          block,
          nodeTx,
          txHash,
          txIndex,
        });

        logger.info(
          `Transaction created and added to block #${block.blockNumber} blockHash=${block.hash}. txHash=${tx.hash}, transactionId=${tx.id}`
        );

        try {
          // add outputs
          logger.info(
            `Adding ${nodeTx.outputs.length} outputs to block #${block.blockNumber} txHash=${tx.hash}`
          );
          const outputsToInsert = this.getOutputsToInsert({
            nodeOutputs: nodeTx.outputs,
            txId: tx.id,
            blockNumber: block.blockNumber,
          });
          await this.addOutputsToTx({ outputs: outputsToInsert });

          // add inputs
          logger.info(
            `Adding ${nodeTx.inputs.length} inputs to block #${block.blockNumber} txHash=${tx.hash}`
          );
          const inputsToInsert = await this.getInputsToInsert({
            nodeInputs: nodeTx.inputs,
            blockNumber: block.blockNumber,
            txId: tx.id,
          });
          await this.addInputsToTx({ inputs: inputsToInsert });
          logger.info(
            `All ${
              inputsToInsert.length + outputsToInsert.length
            } inputs and outputs where added to block #${block.blockNumber} txHash=${tx.hash}`
          );

          if (txIndex === 0) {
            await this.updateBlockCoinbaseParams({ outputs: outputsToInsert, block });
          }

          // add data to Addresses, Assets, AddressTxs, AssetTxs
          await this.calcAddressAssetsPerTx({
            inputs: inputsToInsert,
            outputs: outputsToInsert,
            tx,
            block,
          });

          await this.addContract({ txHash, nodeBlock });
        } catch (error) {
          throw new Error(`${error.message} txHash=${tx.hash}`);
        }
      }
    }
    const hrEnd = process.hrtime(startTime);
    logger.info(
      `AddBlock Finished. blockNumber=${nodeBlock.header.blockNumber}. Time elapsed = ${
        (hrEnd[0] * 1e9 + hrEnd[1]) / 1000000
      }ms`
    );
    return block;
  }

  async isReorg({ nodeBlock } = {}) {
    const { parent, blockNumber } = nodeBlock.header;
    if (blockNumber > 1) {
      const prevDbBlock = await blocksDAL.findById(blockNumber - 1, {
        transaction: this.dbTransaction,
      });
      if (prevDbBlock.hash !== parent) {
        return true;
      }
    }
    return false;
  }

  async createBlock({ nodeBlock } = {}) {
    return blocksDAL.create(
      {
        blockNumber: nodeBlock.header.blockNumber,
        version: nodeBlock.header.version,
        hash: nodeBlock.hash,
        parent: nodeBlock.header.parent,
        commitments: nodeBlock.header.commitments,
        timestamp: nodeBlock.header.timestamp,
        difficulty: nodeBlock.header.difficulty,
        nonce1: nodeBlock.header.nonce[0],
        nonce2: nodeBlock.header.nonce[1],
        txsCount: Object.keys(nodeBlock.transactions).length,
        reward:
          nodeBlock.header.blockNumber == 1
            ? new Decimal(this.genesisTotalZp).times(100000000).toString()
            : nodeBlock.reward,
        coinbaseAmount: 0,
        allocationAmount: 0,
      },
      { transaction: this.dbTransaction }
    );
  }

  async addTxToBlock({ block, nodeTx, txHash, txIndex } = {}) {
    return txsDAL.create(
      {
        blockNumber: block.blockNumber,
        index: txIndex,
        version: nodeTx.version,
        hash: txHash,
        inputCount: nodeTx.inputs ? nodeTx.inputs.length : 0,
        outputCount: nodeTx.outputs ? nodeTx.outputs.length : 0,
      },
      { transaction: this.dbTransaction }
    );
  }

  async addContract({ nodeBlock, txHash }) {
    const nodeTransaction = nodeBlock.transactions[txHash];
    let created = 0;
    if (nodeTransaction.contract) {
      logger.info(
        `Found a contract - blockNumber=${nodeBlock.header.blockNumber}. txHash=${txHash}`
      );
      const nodeContract = nodeTransaction.contract;
      let dbContract = await contractsDAL.findById(nodeContract.contractId, {
        transaction: this.dbTransaction,
      });

      if (!dbContract) {
        dbContract = await contractsDAL.create(
          {
            id: nodeContract.contractId,
            address: nodeContract.address,
            version: this.blockchainParser.getContractVersion(nodeContract.contractId),
            code: nodeContract.code,
            expiryBlock: 0,
            txsCount: '0',
            assetsIssued: '0',
            lastActivationBlock: nodeBlock.header.blockNumber,
          },
          { transaction: this.dbTransaction }
        );
        created = 1;
      } else {
        dbContract.update(
          { lastActivationBlock: nodeBlock.header.blockNumber },
          { transaction: this.dbTransaction }
        );
      }
      const tx = await txsDAL.findOne({
        where: { hash: txHash },
        transaction: this.dbTransaction,
      });

      await contractsDAL.addActivationTx(dbContract, tx, {
        transaction: this.dbTransaction,
      });
    }
    return created;
  }

  getOutputsToInsert({ nodeOutputs, txId, blockNumber } = {}) {
    return nodeOutputs.map((nodeOutput, index) => {
      const { lockType, lockValue, address } = this.blockchainParser.getLockValuesFromOutput(
        nodeOutput
      );
      return {
        blockNumber,
        txId,
        index,
        lockType,
        lockValue,
        address,
        asset: nodeOutput.spend ? nodeOutput.spend.asset : null,
        amount: nodeOutput.spend ? nodeOutput.spend.amount : null,
      };
    });
  }

  async addOutputsToTx({ outputs }) {
    return await outputsDAL.bulkCreate(outputs, { transaction: this.dbTransaction });
  }

  async getInputsToInsert({ nodeInputs, txId, blockNumber }) {
    const promises = nodeInputs.map(async (nodeInput, index) => {
      const basicInput = {
        blockNumber,
        txId,
        index,
      };
      if (nodeInput.outpoint) {
        if (!this.blockchainParser.isOutpointInputValid(nodeInput)) {
          throw new Error(`Outpoint input not valid! inputIndex=${index}`);
        }
        const outpointTxHash = nodeInput.outpoint.txHash;
        const outpointIndex = Number(nodeInput.outpoint.index);
        const output = await this.findOutpoint({ outpointIndex, outpointTxHash });
        if (output) {
          return Object.assign({}, basicInput, {
            outpointTxHash,
            outpointIndex,
            isMint: false,
            outputId: output.id,
            lockType: output.lockType,
            address: output.address,
            asset: output.asset,
            amount: output.amount,
          });
        } else {
          // get transaction and block for a better error message
          const tx = await txsDAL.findById(txId, {
            transaction: this.dbTransaction,
          });
          const errorMsg = `Did not find an output for an outpoint input! outpointIndex=${outpointIndex} outpointTxHash=${outpointTxHash}, current txHash=${tx.hash} inputIndex=${index} blockNumber=${blockNumber}`;
          throw new Error(errorMsg);
        }
      } else if (nodeInput.mint) {
        if (!this.blockchainParser.isMintInputValid(nodeInput)) {
          throw new Error(`Mint input not valid! inputIndex=${index}`);
        }
        return Object.assign({}, basicInput, {
          isMint: true,
          asset: nodeInput.mint.asset,
          amount: Number(nodeInput.mint.amount),
        });
      } else {
        throw new Error(`Input is invalid! inputIndex=${index}`);
      }
    });

    return Promise.all(promises);
  }
  async addInputsToTx({ inputs }) {
    return await inputsDAL.bulkCreate(inputs, { transaction: this.dbTransaction });
  }

  async findOutpoint({ outpointIndex, outpointTxHash } = {}) {
    return outputsDAL.findOne({
      where: {
        index: outpointIndex,
      },
      include: [
        {
          model: db.Tx,
          attributes: [],
          where: {
            hash: outpointTxHash,
          },
        },
      ],
      transaction: this.dbTransaction,
    });
  }

  /**
   * Should be called for the coinbase tx only
   */
  async updateBlockCoinbaseParams({ outputs, block } = {}) {
    let coinbaseAmount = new Decimal(0);
    let allocationAmount = new Decimal(0);

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];

      if (output.lockType === 'Coinbase') {
        coinbaseAmount = coinbaseAmount.plus(output.amount);
      }
      if (output.lockType === 'Contract') {
        allocationAmount = allocationAmount.plus(output.amount);
      }
    }

    return block.update(
      {
        coinbaseAmount: coinbaseAmount.toString(),
        allocationAmount: allocationAmount.toString(),
      },
      { transaction: this.dbTransaction }
    );
  }

  /**
   * Calculate data for the tables Addresses, Assets, AddressTxs, AssetTxs
   * @param {*} params - all params are database entries
   */
  async calcAddressAssetsPerTx({ inputs, outputs, tx, block } = {}) {
    const initAddressAsset = () => ({
      inputSum: new Decimal(0),
      outputSum: new Decimal(0),
    });
    const initAsset = () => ({
      issued: new Decimal(0),
      destroyed: new Decimal(0),
    });
    const addresses = new Map();
    const assets = new Map();

    // go over outputs
    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const address = output.address;
      const asset = output.asset;
      // address
      if (address) {
        if (!addresses.has(address)) {
          addresses.set(address, {});
        }
        if (!addresses.get(address)[asset]) {
          addresses.get(address)[asset] = initAddressAsset();
        }

        // add to outputSum for the asset
        const addressObj = addresses.get(address);
        addressObj[asset].outputSum = addressObj[asset].outputSum.plus(output.amount);
      }

      // asset
      if (!assets.has(asset)) {
        assets.set(asset, initAsset());
      }
      if (output.lockType === 'Destroy') {
        const assetObj = assets.get(asset);
        assetObj.destroyed = assetObj.destroyed.plus(output.amount);
      }
    }

    // go over inputs
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const address = input.address;
      const asset = input.asset;
      // address
      if (address && !input.isMint) {
        if (!addresses.has(address)) {
          addresses.set(address, {});
        }
        if (!addresses.get(address)[asset]) {
          addresses.get(address)[asset] = initAddressAsset();
        }

        // add to inputSum for the asset
        const addressObj = addresses.get(address);
        addressObj[asset].inputSum = addressObj[asset].inputSum.plus(input.amount);
      }

      // asset
      if (!assets.has(asset)) {
        assets.set(asset, initAsset());
      }
      if (input.isMint) {
        const assetObj = assets.get(asset);
        assetObj.issued = assetObj.issued.plus(input.amount);
      }
    }

    // add data to Addresses, Assets
    const promisesAddress = []; // do parallel work
    const addressTxs = [];
    addresses.forEach((assets, address) => {
      // prepare for bulk insert of address txs
      addressTxs.push({
        address,
        blockNumber: tx.blockNumber,
        txId: tx.id,
      });

      // upsert address/asset
      const assetIds = Object.keys(assets);
      assetIds.forEach((asset) => {
        promisesAddress.push(
          (async () => {
            const dbAddress = await addressesDAL.findByAddressAsset({
              address,
              asset,
              transaction: this.dbTransaction,
            });
            if (!dbAddress) {
              await addressesDAL.create(
                {
                  address,
                  asset,
                  inputSum: assets[asset].inputSum.toString(),
                  outputSum: assets[asset].outputSum.toString(),
                  balance: assets[asset].outputSum.minus(assets[asset].inputSum).toString(),
                  txsCount: 1,
                },
                { transaction: this.dbTransaction }
              );
            } else {
              await dbAddress.update(
                {
                  inputSum: assets[asset].inputSum.plus(dbAddress.inputSum).toString(),
                  outputSum: assets[asset].outputSum.plus(dbAddress.outputSum).toString(),
                  balance: assets[asset].outputSum
                    .minus(assets[asset].inputSum)
                    .plus(dbAddress.balance)
                    .toString(),
                  txsCount: new Decimal(dbAddress.txsCount).plus(1).toString(),
                },
                { transaction: this.dbTransaction }
              );
            }
          })()
        );
      });
    });
    promisesAddress.push(addressTxsDAL.bulkCreate(addressTxs, { transaction: this.dbTransaction }));

    // the addresses are needed to calculate the Asset.keyholders
    await Promise.all(promisesAddress);

    const promisesAsset = [];
    // Assets, AssetTxs
    const assetTxs = [];
    assets.forEach((value, asset) => {
      // prepare for bulk insert of address txs
      assetTxs.push({
        asset,
        blockNumber: tx.blockNumber,
        txId: tx.id,
      });

      promisesAsset.push(
        (async () => {
          const [keyholders, dbAsset] = await Promise.all([
            addressesDAL.count({
              where: {
                [Op.and]: {
                  asset,
                  balance: {
                    [Op.gt]: 0,
                  },
                },
              },
              transaction: this.dbTransaction,
            }),
            assetsDAL.findById(asset, {
              transaction: this.dbTransaction,
            }),
          ]);
          const issued = asset === '00' ? new Decimal(block.reward) : value.issued;
          if (!dbAsset) {
            await assetsDAL.create(
              {
                asset,
                issued: issued.toString(),
                destroyed: value.destroyed.toString(),
                outstanding: issued.minus(value.destroyed).toString(),
                keyholders,
                txsCount: 1,
              },
              { transaction: this.dbTransaction }
            );
          } else {
            await dbAsset.update(
              {
                issued: issued.plus(dbAsset.issued).toString(),
                destroyed: value.destroyed.plus(dbAsset.destroyed).toString(),
                outstanding: issued.minus(value.destroyed).plus(dbAsset.outstanding).toString(),
                keyholders,
                txsCount: new Decimal(dbAsset.txsCount).plus(1).toString(),
              },
              { transaction: this.dbTransaction }
            );
          }
        })()
      );
    });
    promisesAsset.push(assetTxsDAL.bulkCreate(assetTxs, { transaction: this.dbTransaction }));

    await Promise.all(promisesAsset);

    // add data to contracts
    const promisesContract = [];
    // addresses are unique
    addresses.forEach((value, address) => {
      if (address.startsWith('c')) {
        promisesContract.push(
          (async () => {
            const contract = await contractsDAL.findByAddress(address, {
              transaction: this.dbTransaction,
            });
            if (contract) {
              await contract.update(
                { txsCount: new Decimal(contract.txsCount).plus(1).toString() },
                { transaction: this.dbTransaction }
              );
            }
          })()
        );
      }
    });
    // assets are unique
    assets.forEach((value, asset) => {
      // check only is an asset was minted
      if (value.issued.gt(0)) {
        promisesContract.push(
          (async () => {
            const contractId = asset.substring(0, 72);
            const contract = await contractsDAL.findById(contractId, {
              transaction: this.dbTransaction,
            });
            if (contract) {
              const assetsIssued = await assetsDAL.count({
                where: {
                  asset: {
                    [Op.like]: `${contractId}%`,
                  },
                },
                transaction: this.dbTransaction,
              });
              await contract.update({ assetsIssued }, { transaction: this.dbTransaction });
            }
          })()
        );
      }
    });

    await Promise.all(promisesContract);
  }
}

module.exports = BlocksAdder;
