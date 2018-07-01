'use strict';

const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../server/components/api/transactions/transactionsDAL');
const outputDAL = require('../../../server/components/api/outputs/outputsDAL');
const inputsDAL = require('../../../server/components/api/inputs/inputsDAL');
const logger = require('../../lib/logger');

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

  async createBlock(nodeBlock) {
    logger.info(`Creating a new block with blockNumber ${nodeBlock.header.blockNumber}  ...`);
    const block = await blocksDAL.create({
      version: nodeBlock.header.version,
      parent: nodeBlock.header.parent,
      blockNumber: nodeBlock.header.blockNumber,
      commitments: nodeBlock.header.commitments,
      timestamp: nodeBlock.header.timestamp,
      difficulty: nodeBlock.header.difficulty,
      nonce1: nodeBlock.header.nonce[0],
      nonce2: nodeBlock.header.nonce[1],
    });
    logger.info(`Block #${nodeBlock.header.blockNumber} created.`);
    return block;
  }

  async addTransactionToBlock(block, nodeTransaction, transactionHash) {
    logger.info(`Creating a new transaction for block #${block.blockNumber}...`);
    const transaction = await transactionsDAL.create({
      version: nodeTransaction.version,
      hash: transactionHash,
    });
    logger.info('Transaction created.');

    logger.info(`Adding the new transaction to block #${block.blockNumber}...`);
    await blocksDAL.addTransaction(block, transaction);
    logger.info('Transaction added to block');
    return transaction;
  }

  async addOutputToTransaction(transaction, nodeOutput, outputIndex) {
    logger.info(`Creating a new output for transaction #${transaction.id}...`);
    let lockType = null;
    let address = null;
    const lockAddressKeys = ['hash', 'pkHash'];
    if (Object.keys(nodeOutput.lock) > 0) {
      lockType = Object.keys(nodeOutput.lock)[0];
      for (let i = 0; i < lockAddressKeys.length; i++) {
        const key = lockAddressKeys[i];
        if (nodeOutput.lock[lockType][key]) {
          address = nodeOutput.lock[lockType][key];
        }
      }
    }
    const output = await outputDAL.create({
      lockType,
      address,
      asset: nodeOutput.spend.asset,
      amount: nodeOutput.spend.amount,
      index: outputIndex,
    });
    logger.info('Output created.');

    logger.info(`Adding the new output to transaction #${transaction.id}...`);
    await transactionsDAL.addOutput(transaction, output);
    logger.info('Output added to transaction');

    return output;
  }

  async addNewBlocks(job) {
    let numberOfBlocksAdded = 0;
    let latestBlockNumberInDB = await this.getLatestBlockNumberInDB();
    const latestBlockNumberInNode = await this.networkHelper.getLatestBlockNumberFromNode();
    const latestBlockNumberToAdd = getJobData(job, 'limit')
      ? latestBlockNumberInDB + Number(getJobData(job, 'limit'))
      : latestBlockNumberInNode;

    logger.info('Block numbers:\n', {
      latestBlockNumberInDB,
      latestBlockNumberToAdd,
      needsUpdate: latestBlockNumberToAdd > latestBlockNumberInDB,
    });

    if (latestBlockNumberToAdd > latestBlockNumberInDB) {
      // add the block synced to have the right incrementing ids
      for (
        let blockNumber = latestBlockNumberInDB + 1;
        blockNumber <= latestBlockNumberToAdd;
        blockNumber++
      ) {
        logger.info(`Getting block #${blockNumber} from NODE...`);
        const newBlock = await this.networkHelper.getBlockFromNode(blockNumber);
        logger.info(`Got block #${newBlock.header.blockNumber} from NODE...`);

        try {
          const block = await this.createBlock(newBlock);

          // TODO - if something inside fail, delete the block from DB!

          const skipTransactions = getJobData(job, 'skipTransactions');

          if (!skipTransactions) {
            // transactions
            const transactionHashes = Object.keys(newBlock.transactions);
            const transactionsToAdd = getJobData(job, 'limitTransactions')
              ? getJobData(job, 'limitTransactions')
              : transactionHashes.length;
            for (
              let transactionIndex = 0;
              transactionIndex < transactionsToAdd;
              transactionIndex++
            ) {
              const hash = transactionHashes[transactionIndex];
              const nodeTransaction = newBlock.transactions[hash];
              const transaction = await this.addTransactionToBlock(block, nodeTransaction, hash);

              // add outputs
              for (
                let outputIndex = 0;
                outputIndex < nodeTransaction.outputs.length;
                outputIndex++
              ) {
                const nodeOutput = nodeTransaction.outputs[outputIndex];

                await this.addOutputToTransaction(transaction, nodeOutput, outputIndex);
              }

              // add inputs
            }
          }
        } catch (error) {
          logger.error(`Error creating #${newBlock.header.blockNumber}`, error);
          // do not skip a block
          // TODO remove last block if was created!
          throw error;
        }
        numberOfBlocksAdded++;
      }
    }

    return numberOfBlocksAdded;
  }
}

module.exports = BlocksAdder;
