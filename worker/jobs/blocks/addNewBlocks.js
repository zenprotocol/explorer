'use strict';

const Service = require('../../../server/lib/Service');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../server/components/api/transactions/transactionsDAL');
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

async function getLatestBlockNumberFromNode() {
  const info = await Service.blocks.getChainInfo();
  return info.blocks;
}

async function getLatestBlockNumberInDB() {
  let blockNumber = 0;
  const latestBlocksInDB = await blocksDAL.findLatest();
  if (latestBlocksInDB.length) {
    const latestBlockInDB = latestBlocksInDB[0];
    blockNumber = latestBlockInDB.blockNumber;
  }
  return blockNumber;
}

async function createBlock(nodeBlock) {
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

async function addTransactionToBlock(block, nodeTransaction, transactionHash) {
  logger.info(`Creating a new transaction for block #${block.blockNumber}...`);
  // create the transaction
  const transaction = await transactionsDAL.create({
    version: nodeTransaction.version,
    hash: transactionHash,
  });

  logger.info('Transaction created.');

  logger.info(`Adding the new transaction to block #${block.blockNumber}...`);
  await blocksDAL.addTransaction(block, transaction);
  logger.info('Transaction added to block');
  // return it
  return transaction;
}

module.exports = async function addNewBlocks(job) {
  let numberOfBlocksAdded = 0;
  let latestBlockNumberInDB = await getLatestBlockNumberInDB();
  const latestBlockNumberInNode = await getLatestBlockNumberFromNode();
  const latestBlockNumberToAdd = getJobData(job, 'limit')
    ? latestBlockNumberInDB + Number(getJobData(job, 'limit'))
    : latestBlockNumberInNode;

  logger.info('Block numbers:\n', {
    latestBlockNumberInDB,
    latestBlockNumberInNode,
    needsUpdate: latestBlockNumberInNode > latestBlockNumberInDB,
  });

  if (latestBlockNumberInNode > latestBlockNumberInDB) {
    // add the block synced to have the right incrementing ids
    for (
      let blockNumber = latestBlockNumberInDB + 1;
      blockNumber <= latestBlockNumberToAdd;
      blockNumber++
    ) {
      logger.info(`Getting block #${blockNumber} from NODE...`);
      const newBlock = await Service.blocks.getBlock(blockNumber);
      logger.info(`Got block #${newBlock.header.blockNumber} from NODE...`);

      try {
        const block = await createBlock(newBlock);

        const skipTransactions = getJobData(job, 'skipTransactions');

        if (!skipTransactions) {
          // transactions
          const transactionHashes = Object.keys(newBlock.transactions);
          const transactionsToAdd = getJobData(job, 'limitTransactions')
            ? getJobData(job, 'limitTransactions')
            : transactionHashes.length;
          for (let i = 0; i < transactionsToAdd; i++) {
            const hash = transactionHashes[i];
            const transaction = await addTransactionToBlock(block, newBlock.transactions[hash], hash);

            // add outputs

            // add inputs
          }
        }
      } catch (error) {
        logger.error(`Error creating #${newBlock.header.blockNumber}`, error);
        // do not skip a block
        break;
      }
      numberOfBlocksAdded++;
    }
  }

  return numberOfBlocksAdded;
};
