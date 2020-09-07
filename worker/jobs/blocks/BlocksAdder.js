'use strict';

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

class BlocksAdder {
  constructor(networkHelper, blockchainParser) {
    this.networkHelper = networkHelper;
    this.blockchainParser = blockchainParser;
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
        const infos = await this.updateInfos();
        this.blockchainParser.setChain(infos.chain);

        this.dbTransaction = await db.sequelize.transaction();

        for (
          let blockNumber = latestBlockNumberInDB + 1;
          blockNumber <= latestBlockNumberToAdd;
          blockNumber++
        ) {
          const nodeBlock = await Promise.all([
            this.networkHelper.getBlockFromNode(blockNumber),
            this.networkHelper.getBlockRewardFromNode(blockNumber),
          ]).then(([block, reward]) =>
            Object.assign(block, { reward: blockNumber === 1 ? 0 : reward })
          );

          logger.info(`Got block #${nodeBlock.header.blockNumber} from NODE...`);
          blocks.push(await this.addBlock({ nodeBlock }));
        }
        const blockNumbers = blocks.map((block) => {
          return block.blockNumber;
        });

        await this.relateAllOutpointInputsToOutputs({ blockNumbers });

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

  async updateInfos() {
    const infos = await this.networkHelper.getBlockchainInfo();
    const infoKeys = Object.keys(infos);
    const promises = [];
    infoKeys.forEach((name) => {
      const value = infos[name];
      promises.push(
        (async () => {
          const info = await infosDAL.findByName(name);
          if (info) {
            await infosDAL.update(info.id, {
              name,
              value,
            });
          } else {
            await infosDAL.create({
              name,
              value,
            });
          }
        })()
      );
    });
    await Promise.all(promises);
    return infos;
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
    const skipTransactions = getJobData(this.job, 'skipTransactions');
    if (!skipTransactions) {
      // transactions
      const transactionHashes = Object.keys(nodeBlock.transactions);
      const transactionsToAdd = getJobData(this.job, 'limitTransactions')
        ? Math.min(getJobData(this.job, 'limitTransactions'), transactionHashes.length)
        : transactionHashes.length;
      for (let transactionIndex = 0; transactionIndex < transactionsToAdd; transactionIndex++) {
        const txHash = transactionHashes[transactionIndex];
        const nodeTransaction = nodeBlock.transactions[txHash];
        const transaction = await this.addTransactionToBlock({
          block,
          nodeTransaction,
          transactionHash: txHash,
          transactionIndex,
        });

        logger.info(
          `Transaction created and added to block #${block.blockNumber} blockHash=${block.hash}. txHash=${transaction.hash}, transactionId=${transaction.id}`
        );

        await this.addContract({ txHash, nodeBlock });

        try {
          // add outputs
          logger.info(
            `Adding ${nodeTransaction.outputs.length} outputs to block #${block.blockNumber} txHash=${transaction.hash}`
          );
          const outputsToInsert = this.getOutputsToInsert({
            nodeOutputs: nodeTransaction.outputs,
            txId: transaction.id,
            blockNumber: block.blockNumber,
          });
          await this.addOutputsToTransaction({ outputs: outputsToInsert });

          // add inputs
          logger.info(
            `Adding ${nodeTransaction.inputs.length} inputs to block #${block.blockNumber} txHash=${transaction.hash}`
          );
          const inputsToInsert = this.getInputsToInsert({
            nodeInputs: nodeTransaction.inputs,
            blockNumber: block.blockNumber,
            txId: transaction.id,
          });
          await this.addInputsToTransaction({ inputs: inputsToInsert });
          logger.info(
            `All ${
              inputsToInsert.length + outputsToInsert.length
            } inputs and outputs where added to block #${block.blockNumber} txHash=${
              transaction.hash
            }`
          );
        } catch (error) {
          throw new Error(`${error.message} txHash=${transaction.hash}`);
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
    const block = await blocksDAL.create(
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
        reward: nodeBlock.reward,
        coinbaseAmount: 0, // TODO: calc
        allocationAmount: 0, // TODO: calc
      },
      { transaction: this.dbTransaction }
    );
    return block;
  }

  async addTransactionToBlock({ block, nodeTransaction, transactionHash, transactionIndex } = {}) {
    const tx = await txsDAL.create(
      {
        blockNumber: block.blockNumber,
        index: transactionIndex,
        version: nodeTransaction.version,
        hash: transactionHash,
        inputCount: nodeTransaction.inputs ? nodeTransaction.inputs.length : 0,
        outputCount: nodeTransaction.outputs ? nodeTransaction.outputs.length : 0,
      },
      { transaction: this.dbTransaction }
    );

    return tx;
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
            version: 0, // TODO: ask david how to use zenjs for this
            code: nodeContract.code,
            expiryBlock: 0, // TODO: ask david
          },
          { transaction: this.dbTransaction }
        );
        created = 1;
      }
      const transaction = await txsDAL.findOne({
        where: { hash: txHash },
        transaction: this.dbTransaction,
      });
      
      await contractsDAL.addActivationTx(dbContract, transaction, {
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

  async addOutputsToTransaction({ outputs }) {
    return await outputsDAL.bulkCreate(outputs, { transaction: this.dbTransaction });
  }

  getInputsToInsert({ nodeInputs, txId, blockNumber }) {
    return nodeInputs.map((nodeInput, index) => {
      const basicInput = {
        blockNumber,
        txId,
        index,
      };
      if (nodeInput.outpoint) {
        if (!this.blockchainParser.isOutpointInputValid(nodeInput)) {
          throw new Error(`Outpoint input not valid! inputIndex=${index}`);
        }
        return Object.assign({}, basicInput, {
          outpointTxHash: nodeInput.outpoint.txHash,
          outpointIndex: Number(nodeInput.outpoint.index),
          isMint: false,
        });
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
  }
  async addInputsToTransaction({ inputs }) {
    return await inputsDAL.bulkCreate(inputs, { transaction: this.dbTransaction });
  }

  /**
   * Should run after all the blocks are already in the database
   */
  async relateAllOutpointInputsToOutputs({ blockNumbers } = {}) {
    logger.info(`Searching for all outpoint inputs in blocks [${blockNumbers}]`);
    const inputs = await inputsDAL.findAll({
      where: {
        isMint: false,
        blockNumber: {
          [db.Sequelize.Op.in]: blockNumbers,
        },
      },
      transaction: this.dbTransaction,
    });
    logger.info(
      `Found ${inputs.length} outpoint inputs that need to be related to outputs. relating...`
    );
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      await this.relateInputToOutput({ input });
    }
  }

  async relateInputToOutput({ input } = {}) {
    const output = await outputsDAL.findOne({
      where: {
        index: input.outpointIndex,
      },
      include: [
        {
          model: db.Tx,
          attributes: [],
          where: {
            hash: input.outpointTxHash,
          },
        },
      ],
      transaction: this.dbTransaction,
    });
    if (output) {
      await inputsDAL.setOutput(input, output, { transaction: this.dbTransaction });
      return true;
    } else {
      // get transaction and block for a better error message
      const tx = await txsDAL.findById(input.txId, {
        transaction: this.dbTransaction,
      });
      const errorMsg = `Did not find an output for an outpoint input! outpointIndex=${input.outpointIndex} outpointTxHash=${input.outpointTxHash}, current txHash=${tx.hash} inputIndex=${input.index} blockNumber=${input.blockNumber}`;
      throw new Error(errorMsg);
    }
  }
}

module.exports = BlocksAdder;
