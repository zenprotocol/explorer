'use strict';

const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../server/components/api/transactions/transactionsDAL');
const outputsDAL = require('../../../server/components/api/outputs/outputsDAL');
const inputsDAL = require('../../../server/components/api/inputs/inputsDAL');
const infosDAL = require('../../../server/components/api/infos/infosDAL');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const logger = require('../../lib/logger')('blocks');
const getJobData = require('../../lib/getJobData');
const QueueError = require('../../lib/QueueError');

class BlocksAdder {
  constructor(networkHelper, blockchainParser) {
    this.networkHelper = networkHelper;
    this.blockchainParser = blockchainParser;
  }

  async addNewBlocks(job) {
    const startTime = process.hrtime();
    let dbTransaction = null;
    try {
      await this.setSyncingStatus({ syncing: true });
      let latestBlockNumberInDB = await this.getLatestBlockNumberInDB();
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
        const infos = await this.updateInfos();
        this.blockchainParser.setChain(infos.chain);

        dbTransaction = await blocksDAL.db.sequelize.transaction();

        for (
          let blockNumber = latestBlockNumberInDB + 1;
          blockNumber <= latestBlockNumberToAdd;
          blockNumber++
        ) {
          const nodeBlock = await Promise.all([
            this.networkHelper.getBlockFromNode(blockNumber),
            this.networkHelper.getBlockRewardFromNode(blockNumber),
          ]).then(([block, reward]) => Object.assign(block, { reward }));

          logger.info(`Got block #${nodeBlock.header.blockNumber} from NODE...`);
          blocks.push(await this.addBlock({ job, nodeBlock, dbTransaction }));
        }
        const blockIds = blocks.map(block => {
          return block.id;
        });

        await this.relateAllOutpointInputsToOutputs({ dbTransaction, blockIds });

        logger.info('Commit the database transaction');
        await dbTransaction.commit();
      }
      await this.setSyncingStatus({ syncing: false });
      const hrEnd = process.hrtime(startTime);
      logger.info(`AddNewBlocks Finished. Time elapsed = ${hrEnd[0]}s ${hrEnd[1] / 1000000}ms`);
      return blocks.length;
    } catch (error) {
      logger.error(`An Error has occurred when adding blocks: ${error.message}`);
      if (dbTransaction) {
        logger.info('Rollback the database transaction');
        await dbTransaction.rollback();
      }
      throw new QueueError(error);
    }
  }

  async getLatestBlockNumberInDB() {
    let blockNumber = 0;
    const latestBlockInDB = await blocksDAL.findLatest();
    if (latestBlockInDB) {
      blockNumber = latestBlockInDB.blockNumber;
    }
    return blockNumber;
  }

  async updateInfos() {
    const infos = await this.networkHelper.getBlockchainInfo();
    const infoKeys = Object.keys(infos);
    const promises = [];
    infoKeys.forEach(name => {
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

  async setSyncingStatus({ syncing = false } = {}) {
    const name = 'syncing';
    const info = await infosDAL.findByName(name);
    if (info) {
      await infosDAL.update(info.id, {
        name,
        value: syncing,
      });
    } else {
      await infosDAL.create({
        name,
        value: syncing,
      });
    }
  }

  async addBlock({ job, nodeBlock, dbTransaction } = {}) {
    const startTime = process.hrtime();
    if (await this.isReorg({ nodeBlock, dbTransaction })) {
      throw new Error('Reorg');
    }
    const block = await this.createBlock({ nodeBlock, dbTransaction });
    logger.info(`Block #${block.blockNumber} created. id=${block.id} hash=${block.hash}`);
    const skipTransactions = getJobData(job, 'skipTransactions');

    if (!skipTransactions) {
      // transactions
      const transactionHashes = Object.keys(nodeBlock.transactions);
      const transactionsToAdd = getJobData(job, 'limitTransactions')
        ? Math.min(getJobData(job, 'limitTransactions'), transactionHashes.length)
        : transactionHashes.length;
      for (let transactionIndex = 0; transactionIndex < transactionsToAdd; transactionIndex++) {
        const transactionHash = transactionHashes[transactionIndex];
        const nodeTransaction = nodeBlock.transactions[transactionHash];
        const transaction = await this.addTransactionToBlock({
          block,
          nodeTransaction,
          transactionHash,
          transactionIndex,
          dbTransaction,
        });
        logger.info(
          `Transaction created and added to block #${block.blockNumber} blockHash=${
            block.hash
          }. txHash=${transaction.hash}, transactionId=${transaction.id}`
        );

        await this.addContract({ transactionHash, nodeBlock, dbTransaction });

        try {
          // add outputs
          logger.info(
            `Adding ${nodeTransaction.outputs.length} outputs to block #${
              block.blockNumber
            } txHash=${transaction.hash}`
          );
          const outputsToInsert = this.getOutputsToInsert({
            nodeOutputs: nodeTransaction.outputs,
            transactionId: transaction.id,
          });
          await this.addOutputsToTransaction({ outputs: outputsToInsert, dbTransaction });

          // add inputs
          logger.info(
            `Adding ${nodeTransaction.inputs.length} inputs to block #${block.blockNumber} txHash=${
              transaction.hash
            }`
          );
          const inputsToInsert = this.getInputsToInsert({
            nodeInputs: nodeTransaction.inputs,
            transactionId: transaction.id,
          });
          await this.addInputsToTransaction({ inputs: inputsToInsert, dbTransaction });
          logger.info(
            `All ${inputsToInsert.length +
              outputsToInsert.length} inputs and outputs where added to block #${
              block.blockNumber
            } txHash=${transaction.hash}`
          );
        } catch (error) {
          throw new Error(`${error.message} txHash=${transaction.hash}`);
        }
      }
    }
    const hrEnd = process.hrtime(startTime);
    logger.info(
      `AddBlock Finished. blockNumber=${nodeBlock.header.blockNumber}. Time elapsed = ${(hrEnd[0] *
        1e9 +
        hrEnd[1]) /
        1000000}ms`
    );
    return block;
  }

  async isReorg({ nodeBlock, dbTransaction } = {}) {
    const { parent, blockNumber } = nodeBlock.header;
    if (blockNumber > 1) {
      const prevDbBlock = await blocksDAL.findByBlockNumber(blockNumber - 1, {
        transaction: dbTransaction,
      });
      if (prevDbBlock.hash !== parent) {
        return true;
      }
    }
    return false;
  }

  async createBlock({ nodeBlock, dbTransaction } = {}) {
    const block = await blocksDAL.create(
      {
        version: nodeBlock.header.version,
        hash: nodeBlock.hash,
        parent: nodeBlock.header.parent,
        blockNumber: nodeBlock.header.blockNumber,
        commitments: nodeBlock.header.commitments,
        timestamp: nodeBlock.header.timestamp,
        difficulty: nodeBlock.header.difficulty,
        nonce1: nodeBlock.header.nonce[0],
        nonce2: nodeBlock.header.nonce[1],
        transactionCount: Object.keys(nodeBlock.transactions).length,
        reward: nodeBlock.reward,
      },
      { transaction: dbTransaction }
    );
    return block;
  }

  async addTransactionToBlock({
    block,
    nodeTransaction,
    transactionHash,
    transactionIndex,
    dbTransaction,
  } = {}) {
    const transaction = await transactionsDAL.create(
      {
        version: nodeTransaction.version,
        hash: transactionHash,
        index: transactionIndex,
        inputCount: nodeTransaction.inputs ? nodeTransaction.inputs.length : 0,
        outputCount: nodeTransaction.outputs ? nodeTransaction.outputs.length : 0,
      },
      { transaction: dbTransaction }
    );

    await blocksDAL.addTransaction(block, transaction, { transaction: dbTransaction });
    return transaction;
  }

  async addContract({ nodeBlock, transactionHash, dbTransaction }) {
    const nodeTransaction = nodeBlock.transactions[transactionHash];
    let created = 0;
    if (nodeTransaction.contract) {
      logger.info(
        `Found a contract - blockNumber=${nodeBlock.header.blockNumber}. txHash=${transactionHash}`
      );
      const nodeContract = nodeTransaction.contract;
      let dbContract = await contractsDAL.findById(nodeContract.contractId, {
        transaction: dbTransaction,
      });

      if (!dbContract) {
        dbContract = await contractsDAL.create(
          {
            id: nodeContract.contractId,
            address: nodeContract.address,
            code: nodeContract.code,
          },
          { transaction: dbTransaction }
        );
        created = 1;
      }
      const transaction = await transactionsDAL.findOne({
        where: { hash: transactionHash },
        transaction: dbTransaction,
      });
      await contractsDAL.addActivationTransaction(dbContract, transaction, { transaction: dbTransaction });
    }
    return created;
  }

  getOutputsToInsert({ nodeOutputs, transactionId } = {}) {
    return nodeOutputs.map((nodeOutput, index) => {
      const { lockType, lockValue, address } = this.blockchainParser.getLockValuesFromOutput(
        nodeOutput
      );
      return {
        lockType,
        lockValue,
        address,
        contractLockVersion: 0,
        asset: nodeOutput.spend ? nodeOutput.spend.asset : null,
        amount: nodeOutput.spend ? nodeOutput.spend.amount : null,
        index,
        TransactionId: transactionId,
      };
    });
  }

  async addOutputsToTransaction({ outputs, dbTransaction }) {
    return await outputsDAL.bulkCreate(outputs, { transaction: dbTransaction });
  }

  getInputsToInsert({ nodeInputs, transactionId }) {
    return nodeInputs.map((nodeInput, index) => {
      if (nodeInput.outpoint) {
        if (!this.blockchainParser.isOutpointInputValid(nodeInput)) {
          throw new Error(`Outpoint input not valid! inputIndex=${index}`);
        }
        return {
          index,
          outpointTXHash: nodeInput.outpoint.txHash,
          outpointIndex: Number(nodeInput.outpoint.index),
          isMint: false,
          TransactionId: transactionId,
        };
      } else if (nodeInput.mint) {
        if (!this.blockchainParser.isMintInputValid(nodeInput)) {
          throw new Error(`Mint input not valid! inputIndex=${index}`);
        }
        return {
          index,
          isMint: true,
          asset: nodeInput.mint.asset,
          amount: Number(nodeInput.mint.amount),
          TransactionId: transactionId,
        };
      } else {
        throw new Error(`Input is invalid! inputIndex=${index}`);
      }
    });
  }
  async addInputsToTransaction({ inputs, dbTransaction }) {
    return await inputsDAL.bulkCreate(inputs, { transaction: dbTransaction });
  }

  /**
   * Should run after all the blocks are already in the database
   */
  async relateAllOutpointInputsToOutputs({ dbTransaction, blockIds } = {}) {
    logger.info(`Searching for all outpoint inputs in blocks ids=[${blockIds}]`);
    const inputs = await inputsDAL.findAll({
      where: {
        isMint: false,
      },
      include: [
        {
          model: inputsDAL.db.Transaction,
          attributes: [],
          where: {
            BlockId: {
              [inputsDAL.db.sequelize.Op.in]: blockIds,
            },
          },
        },
      ],
      transaction: dbTransaction,
    });
    logger.info(
      `Found ${inputs.length} outpoint inputs that need to be related to outputs. relating...`
    );
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      await this.relateInputToOutput({ input, dbTransaction });
    }
  }

  async relateInputToOutput({ input, dbTransaction } = {}) {
    const output = await outputsDAL.findOne({
      where: {
        index: input.outpointIndex,
      },
      include: [
        {
          model: outputsDAL.db.Transaction,
          attributes: [],
          where: {
            hash: input.outpointTXHash,
          },
        },
      ],
      transaction: dbTransaction,
    });
    if (output) {
      await inputsDAL.setOutput(input, output, { transaction: dbTransaction });
      return true;
    } else {
      // get transaction and block for a better error message
      const transaction = await transactionsDAL.findById(input.TransactionId, {
        transaction: dbTransaction,
      });
      const block = await blocksDAL.findById(transaction.BlockId, { transaction: dbTransaction });
      const errorMsg = `Did not find an output for an outpoint input! outpointIndex=${
        input.outpointIndex
      } outpointTXHash=${input.outpointTXHash}, current txHash=${transaction.hash} inputIndex=${
        input.index
      } blockNumber=${block.blockNumber}`;
      throw new Error(errorMsg);
    }
  }
}

module.exports = BlocksAdder;
