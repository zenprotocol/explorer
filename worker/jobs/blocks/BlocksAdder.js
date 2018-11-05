'use strict';

const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../server/components/api/transactions/transactionsDAL');
const outputsDAL = require('../../../server/components/api/outputs/outputsDAL');
const inputsDAL = require('../../../server/components/api/inputs/inputsDAL');
const infosDAL = require('../../../server/components/api/infos/infosDAL');
const logger = require('../../lib/logger');
const BlockchainParser = require('../../../server/lib/BlockchainParser');

/**
 * Get a key from the job data object
 *
 * @param {Object} job
 * @param {String} key
 * @returns the key or null
 */
function getJobData(job, key) {
  if (job && job.data && job.data[key]) {
    return job.data[key];
  }
  return null;
}

class BlocksAdder {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
    this.blockchainParser = new BlockchainParser();
  }

  async addNewBlocks(job) {
    const startTime = process.hrtime();
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

    const addBlockPromises = [];
    let addBlockPromiseResults = [];

    if (latestBlockNumberToAdd > latestBlockNumberInDB) {
      await this.setSyncingStatus({ syncing: true });
      const infos = await this.updateInfos();
      this.blockchainParser.setChain(infos.chain);

      const dbTransaction = await blocksDAL.db.sequelize.transaction();

      try {
        for (
          let blockNumber = latestBlockNumberInDB + 1;
          blockNumber <= latestBlockNumberToAdd;
          blockNumber++
        ) {
          const nodeBlock = await this.networkHelper.getBlockFromNode(blockNumber);
          logger.info(`Got block #${nodeBlock.header.blockNumber} from NODE...`);

          addBlockPromises.push(this.addBlock({ job, nodeBlock, dbTransaction }));
        }
        addBlockPromiseResults = await Promise.all(addBlockPromises);
        const blockIds = addBlockPromiseResults.map(block => {
          return block.id;
        });

        await this.relateAllOutpointInputsToOutputs({ dbTransaction, blockIds });

        // get
        await this.setSyncingStatus({ syncing: false });

        logger.info('Commit the database transaction');
        await dbTransaction.commit();
      } catch (error) {
        logger.error(`An Error has occurred when adding blocks: ${error.message}`);
        logger.info('Rollback the database transaction');
        await dbTransaction.rollback();
        throw error;
      }
    }
    const hrEnd = process.hrtime(startTime);
    logger.info(`AddNewBlocks Finished. Time elapsed = ${hrEnd[0]}s ${hrEnd[1] / 1000000}ms`);
    return addBlockPromiseResults.length;
  }

  async getLatestBlockNumberInDB() {
    let blockNumber = 0;
    const latestBlocksInDB = await blocksDAL.findLatest();
    if (latestBlocksInDB.length) {
      const latestBlockInDB = latestBlocksInDB[0];
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
    // TODO - check here if the block already exist in the db, then if a 'force' param is true, delete and re cache
    const startTime = process.hrtime();
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

        try {
          // add outputs
          logger.info(
            `Adding ${nodeTransaction.outputs.length} outputs to block #${block.blockNumber} txHash=${
              transaction.hash
            }`
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
          await this.addInputsToTransaction({inputs: inputsToInsert, dbTransaction});
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
          throw new Error(
            `Outpoint input not valid! inputIndex=${index}`
          );
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
