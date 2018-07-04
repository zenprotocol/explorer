'use strict';

const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../server/components/api/transactions/transactionsDAL');
const outputsDAL = require('../../../server/components/api/outputs/outputsDAL');
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
    const {lockType, address} = this.getLockValuesFromOutput(nodeOutput);
    const output = await outputsDAL.create({
      lockType,
      address,
      contractLockVersion: 0,
      asset: nodeOutput.spend ? nodeOutput.spend.asset : null,
      amount: nodeOutput.spend ? nodeOutput.spend.amount : null,
      index: outputIndex,
    });
    logger.info('Output created.');

    logger.info(`Adding the new output to transaction #${transaction.id}...`);
    await transactionsDAL.addOutput(transaction, output);
    logger.info('Output added to transaction');

    return output;
  }

  getLockValuesFromOutput(nodeOutput) {
    let lockType = null;
    let address = null;
    if (nodeOutput.lock && typeof nodeOutput.lock !== 'object') {
      lockType = nodeOutput.lock;
    }
    else if (nodeOutput.lock && Object.keys(nodeOutput.lock).length) {
      lockType = Object.keys(nodeOutput.lock)[0];
      const lockTypeValues = Object.values(nodeOutput.lock[lockType]);
      if (lockTypeValues.length) {
        if (lockTypeValues.length === 1) {
          address = Object.values(nodeOutput.lock[lockType])[0];
        } else {
          const addressKeyOptions = ['hash', 'pkHash', 'id', 'data'];
          const lockTypeKeys = Object.keys(nodeOutput.lock[lockType]);
          for (let i = 0; i < lockTypeKeys.length; i++) {
            const key = lockTypeKeys[i];
            if (addressKeyOptions.includes(key)) {
              address = nodeOutput.lock[lockType][key];
              break;
            }
          }
        }
      }
    }

    return {lockType, address};
  }

  async addInputToTransaction(transaction, nodeInput, inputIndex) {
    let amount = null;
    let output = null;

    if (!nodeInput.outpoint) {
      return null;
    }

    logger.info(
      `Searching for the relevant output with hash=${nodeInput.outpoint.txHash} and index=${
        nodeInput.outpoint.index
      }...`
    );
    const transactionsWithRelevantHash = await transactionsDAL.findAll({
      where: {
        hash: nodeInput.outpoint.txHash,
      },
    });
    if (transactionsWithRelevantHash.length === 1) {
      const outputs = await outputsDAL.findAll({
        where: {
          index: nodeInput.outpoint.index,
          TransactionId: transactionsWithRelevantHash[0].id,
        },
      });
      if (outputs.length === 1) {
        logger.info('Found output');
        output = outputs[0];
        amount = output.amount;
      } else {
        outputs.length > 0
          ? logger.warn('Found more than 1 related output!')
          : logger.warn('Did not find an output');
      }
    } else {
      transactionsWithRelevantHash.length > 0
        ? logger.warn(`Found more than 1 transactions with hash=${nodeInput.outpoint.txHash} !`)
        : logger.warn(`Could not find a transaction with hash=${nodeInput.outpoint.txHash}`);
    }

    logger.info(`Creating a new input for transaction #${transaction.id}...`);
    const input = await inputsDAL.create({
      index: inputIndex,
      outpointTXHash: nodeInput.outpoint.txHash,
      outpointIndex: Number(nodeInput.outpoint.index),
      amount,
    });
    logger.info('Input created.');

    logger.info(`Adding the new input to transaction #${transaction.id}...`);
    await transactionsDAL.addInput(transaction, input);
    logger.info('Input added to transaction');

    if (output) {
      logger.info('Setting the found output on the input...');
      await inputsDAL.setOutput(input, output);
      logger.info('Output was set...');
    }
    return input;
  }

  async addNewBlocks(job) {
    let numberOfBlocksAdded = 0;
    let latestBlockNumberInDB = await this.getLatestBlockNumberInDB();
    const latestBlockNumberInNode = await this.networkHelper.getLatestBlockNumberFromNode();
    const latestBlockNumberToAdd = getJobData(job, 'limitBlocks')
      ? Math.min(latestBlockNumberInDB + Number(getJobData(job, 'limitBlocks')), latestBlockNumberInNode)
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

        let block;
        try {
          block = await this.createBlock(newBlock);
          const skipTransactions = getJobData(job, 'skipTransactions');

          if (!skipTransactions) {
            // transactions
            const transactionHashes = Object.keys(newBlock.transactions);
            const transactionsToAdd = getJobData(job, 'limitTransactions')
              ? Math.min(getJobData(job, 'limitTransactions'), transactionHashes.length)
              : transactionHashes.length;
            logger.info(`${transactionsToAdd} transactions to add`);
            for (let transactionIndex = 0; transactionIndex < transactionsToAdd; transactionIndex++) {
              const hash = transactionHashes[transactionIndex];
              const nodeTransaction = newBlock.transactions[hash];
              logger.info(`Transaction #${transactionIndex}`);
              const transaction = await this.addTransactionToBlock(block, nodeTransaction, hash);

              // add outputs
              for (let outputIndex = 0; outputIndex < nodeTransaction.outputs.length; outputIndex++) {
                const nodeOutput = nodeTransaction.outputs[outputIndex];

                await this.addOutputToTransaction(transaction, nodeOutput, outputIndex);
              }

              // add inputs
              for (let inputIndex = 0; inputIndex < nodeTransaction.inputs.length; inputIndex++) {
                const nodeInput = nodeTransaction.inputs[inputIndex];

                await this.addInputToTransaction(transaction, nodeInput, inputIndex);
              }
            }
          }
        } catch (error) {
          logger.error(`Error creating #${newBlock.header.blockNumber} - ${error.message}`);
          if (block && block.id) {
            await blocksDAL.delete(block.id);
          }
          throw error;
        }
        numberOfBlocksAdded++;
      }
    }

    return numberOfBlocksAdded;
  }
}

module.exports = BlocksAdder;
