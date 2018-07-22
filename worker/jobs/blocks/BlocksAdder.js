'use strict';

const bech32 = require('bech32');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../server/components/api/transactions/transactionsDAL');
const outputsDAL = require('../../../server/components/api/outputs/outputsDAL');
const inputsDAL = require('../../../server/components/api/inputs/inputsDAL');
const infosDAL = require('../../../server/components/api/infos/infosDAL');
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
      await this.setSyncingStatus({syncing: true});
      await this.updateInfos();
      // add the block synced to have the right incrementing ids
      for (
        let blockNumber = latestBlockNumberInDB + 1;
        blockNumber <= latestBlockNumberToAdd;
        blockNumber++
      ) {
        logger.info(`Getting block #${blockNumber} from NODE...`);
        const nodeBlock = await this.networkHelper.getBlockFromNode(blockNumber);
        logger.info(`Got block #${nodeBlock.header.blockNumber} from NODE...`);

        let block;
        logger.info('Creating a database transaction for the current block');
        const dbTransaction = await blocksDAL.db.sequelize.transaction();
        try {
          block = await this.createBlock({nodeBlock, dbTransaction});
          const skipTransactions = getJobData(job, 'skipTransactions');

          if (!skipTransactions) {
            // transactions
            const transactionHashes = Object.keys(nodeBlock.transactions);
            const transactionsToAdd = getJobData(job, 'limitTransactions')
              ? Math.min(getJobData(job, 'limitTransactions'), transactionHashes.length)
              : transactionHashes.length;
            logger.info(`${transactionsToAdd} transactions to add`);
            for (let transactionIndex = 0; transactionIndex < transactionsToAdd; transactionIndex++) {
              const transactionHash = transactionHashes[transactionIndex];
              const nodeTransaction = nodeBlock.transactions[transactionHash];
              logger.info(`Transaction #${transactionIndex}`);
              const transaction = await this.addTransactionToBlock({block, nodeTransaction, transactionHash, transactionIndex, dbTransaction});

              // add outputs
              for (let outputIndex = 0; outputIndex < nodeTransaction.outputs.length; outputIndex++) {
                const nodeOutput = nodeTransaction.outputs[outputIndex];

                await this.addOutputToTransaction({transaction, nodeOutput, outputIndex, dbTransaction});
              }

              // add inputs
              for (let inputIndex = 0; inputIndex < nodeTransaction.inputs.length; inputIndex++) {
                const nodeInput = nodeTransaction.inputs[inputIndex];

                await this.addInputToTransaction({transaction, nodeInput, inputIndex, dbTransaction});
              }
            }
          }

          logger.info('Commit the database transaction');
          await dbTransaction.commit();
        } catch (error) {
          logger.error(`Error creating #${nodeBlock.header.blockNumber} - ${error.message}`);
          logger.info('Rollback the database transaction');
          await dbTransaction.rollback();
          throw error;
        }
        numberOfBlocksAdded++;
      }
      await this.setSyncingStatus({syncing: false});
    }

    return numberOfBlocksAdded;
  }

  getAddressFromBCAddress(addressBC) {
    let pkHash = Buffer.from(addressBC,'hex');

    const words = bech32.toWords(pkHash);
    const wordsBuffer = Buffer.from(words);
    const withVersion = Buffer.alloc(words.length + 1);
    withVersion.writeInt8(0,0);
    wordsBuffer.copy(withVersion,1);

    const address = bech32.encode('zen', withVersion);
    return address;
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
    infoKeys.forEach((name) => {
      const value = infos[name];
      promises.push((async () => {
        const info = await infosDAL.findByName(name);
        if(info) {
          await infosDAL.update(info.id, {
            name,
            value,
          });
        }
        else {
          await infosDAL.create({
            name,
            value,
          });
        }
      })());
    });
    await Promise.all(promises);
  }

  async setSyncingStatus({syncing = false} = {}) {
    const name = 'syncing';
    const info = await infosDAL.findByName(name);
    if(info) {
      await infosDAL.update(info.id, {
        name,
        value: syncing,
      });
    }
    else {
      await infosDAL.create({
        name,
        value: syncing,
      });
    }
  }

  async createBlock({nodeBlock, dbTransaction} = {}) {
    logger.info(`Creating a new block with blockNumber ${nodeBlock.header.blockNumber}  ...`);
    const block = await blocksDAL.create({
      version: nodeBlock.header.version,
      hash: nodeBlock.hash,
      parent: nodeBlock.header.parent,
      blockNumber: nodeBlock.header.blockNumber,
      commitments: nodeBlock.header.commitments,
      timestamp: nodeBlock.header.timestamp,
      difficulty: nodeBlock.header.difficulty,
      nonce1: nodeBlock.header.nonce[0],
      nonce2: nodeBlock.header.nonce[1],
      transactionCount: Object.keys(nodeBlock.transactions).length
    }, {transaction: dbTransaction});
    logger.info(`Block #${nodeBlock.header.blockNumber} created.`);
    return block;
  }

  async addTransactionToBlock({block, nodeTransaction, transactionHash, transactionIndex, dbTransaction} = {}) {
    logger.info(`Creating a new transaction for block #${block.blockNumber}...`);
    const transaction = await transactionsDAL.create({
      version: nodeTransaction.version,
      hash: transactionHash,
      index: transactionIndex,
      inputCount: (nodeTransaction.inputs)? nodeTransaction.inputs.length : 0,
      outputCount: (nodeTransaction.outputs)? nodeTransaction.outputs.length : 0,
    }, {transaction: dbTransaction});
    logger.info(`Transaction created. id=${transaction.id} hash=${transaction.hash}`);

    logger.info(`Adding the new transaction to block #${block.blockNumber}...`);
    await blocksDAL.addTransaction(block, transaction, {transaction: dbTransaction});
    logger.info('Transaction added to block');
    return transaction;
  }

  async addOutputToTransaction({transaction, nodeOutput, outputIndex, dbTransaction}) {
    logger.info(`Creating a new output for transaction #${transaction.id} with hash ${transaction.hash}...`);
    const {lockType, address} = this.getLockValuesFromOutput(nodeOutput);
    const addressBC = address;
    let addressWallet = null;
    if(addressBC) {
      addressWallet = this.getAddressFromBCAddress(addressBC);
    }
    const output = await outputsDAL.create({
      lockType,
      addressBC,
      address: addressWallet,
      contractLockVersion: 0,
      asset: nodeOutput.spend ? nodeOutput.spend.asset : null,
      amount: nodeOutput.spend ? nodeOutput.spend.amount : null,
      index: outputIndex,
    }, {transaction: dbTransaction});
    logger.info('Output created.');

    logger.info(`Adding the new output to transaction #${transaction.id}...`);
    await transactionsDAL.addOutput(transaction, output, {transaction: dbTransaction});
    logger.info('Output added to transaction');

    if (addressWallet) {
      logger.info(`Adding address to transaction #${transaction.id}...`);
      await transactionsDAL.addAddress(transaction, addressWallet, {transaction: dbTransaction});
      logger.info('Address added to transaction');
    }

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

  async addInputToTransaction({transaction, nodeInput, inputIndex, dbTransaction}) {
    let amount = null;
    let output = null;

    if (!nodeInput.outpoint) {
      return null;
    }

    logger.info(
      `Searching for the relevant output in transaction with hash=${nodeInput.outpoint.txHash} and index=${
        nodeInput.outpoint.index
      }...`
    );
    const transactionsWithRelevantHash = await transactionsDAL.findAll({
      where: {
        hash: nodeInput.outpoint.txHash,
      },
      transaction: dbTransaction,
    });
    if (transactionsWithRelevantHash.length === 1) {
      const outputs = await outputsDAL.findAll({
        where: {
          index: nodeInput.outpoint.index,
          TransactionId: transactionsWithRelevantHash[0].id,
        },
        transaction: dbTransaction,
      });
      if (outputs.length === 1) {
        logger.info('Found output');
        output = outputs[0];
        amount = output.amount;
      } else {
        outputs.length > 0
          ? logger.error('Found more than 1 related output!')
          : logger.error('Did not find an output');
      }
    } else {
      transactionsWithRelevantHash.length > 0
        ? logger.error(`Found more than 1 transactions with hash=${nodeInput.outpoint.txHash} !`)
        : logger.error(`Could not find a transaction with hash=${nodeInput.outpoint.txHash}`);
    }

    logger.info(`Creating a new input for transaction #${transaction.id} with hash ${transaction.hash}...`);
    const input = await inputsDAL.create({
      index: inputIndex,
      outpointTXHash: nodeInput.outpoint.txHash,
      outpointIndex: Number(nodeInput.outpoint.index),
      amount,
    }, {transaction: dbTransaction});
    logger.info(`Input created. id=${input.id}`);

    logger.info(`Adding the new input to transaction #${transaction.id}...`);
    await transactionsDAL.addInput(transaction, input, {transaction: dbTransaction});
    logger.info('Input added to transaction');

    if (output) {
      logger.info('Setting the found output on the input...');
      await inputsDAL.setOutput(input, output, {transaction: dbTransaction});
      logger.info('Output was set...');

      if(output.address) {
        logger.info(`Adding address to transaction #${transaction.id}...`);
        await transactionsDAL.addAddress(transaction, output.address, {transaction: dbTransaction});
        logger.info('Address added to transaction');
      }
    }
    
    return input;
  }
}

module.exports = BlocksAdder;
