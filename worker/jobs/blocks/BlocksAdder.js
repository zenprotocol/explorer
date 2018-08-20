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
    const startTime = process.hrtime();
    let latestBlockNumberInDB = await this.getLatestBlockNumberInDB();
    const latestBlockNumberInNode = await this.networkHelper.getLatestBlockNumberFromNode();
    const latestBlockNumberToAdd = getJobData(job, 'limitBlocks')
      ? Math.min(
          latestBlockNumberInDB + Number(getJobData(job, 'limitBlocks')),
          latestBlockNumberInNode
        )
      : latestBlockNumberInNode;

    logger.info(`latestBlockNumberInDB=${latestBlockNumberInDB}, latestBlockNumberToAdd=${latestBlockNumberToAdd}`);
    
    const addBlockPromises = [];
    let addBlockPromiseResults = [];

    if (latestBlockNumberToAdd > latestBlockNumberInDB) {
      await this.setSyncingStatus({ syncing: true });
      await this.updateInfos();

      logger.info('Creating a database transaction');
      const dbTransaction = await blocksDAL.db.sequelize.transaction();

      try {
        for (
          let blockNumber = latestBlockNumberInDB + 1;
          blockNumber <= latestBlockNumberToAdd;
          blockNumber++
        ) {
          logger.info(`Getting block #${blockNumber} from NODE...`);
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
        logger.error('An Error has occurred when adding blocks', { error });
        logger.info('Rollback the database transaction');
        await dbTransaction.rollback();
        throw error;
      }
    }
    const hrEnd = process.hrtime(startTime);
    logger.info(`AddNewBlocks Finished. Time elapsed = ${hrEnd[0]}s ${hrEnd[1] / 1000000}ms`);
    return addBlockPromiseResults.length;
  }

  getAddressFromBCAddress(addressBC) {
    let pkHash = Buffer.from(addressBC, 'hex');

    const words = bech32.toWords(pkHash);
    const wordsBuffer = Buffer.from(words);
    const withVersion = Buffer.alloc(words.length + 1);
    withVersion.writeInt8(0, 0);
    wordsBuffer.copy(withVersion, 1);

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
    const results = await Promise.all(promises);
    return results;
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
        const transaction = await this.addTransactionToBlock({
          block,
          nodeTransaction,
          transactionHash,
          transactionIndex,
          dbTransaction,
        });

        // all outputs and inputs can be added simultaneously because they are not related at this point
        const outputsInputsPromises = [];

        // add outputs
        for (let outputIndex = 0; outputIndex < nodeTransaction.outputs.length; outputIndex++) {
          const nodeOutput = nodeTransaction.outputs[outputIndex];

          outputsInputsPromises.push(
            this.addOutputToTransaction({
              transaction,
              nodeOutput,
              outputIndex,
              dbTransaction,
            })
          );
        }

        // add inputs
        for (let inputIndex = 0; inputIndex < nodeTransaction.inputs.length; inputIndex++) {
          const nodeInput = nodeTransaction.inputs[inputIndex];

          outputsInputsPromises.push(
            this.addInputToTransaction({ transaction, nodeInput, inputIndex, dbTransaction })
          );
        }
        await Promise.all(outputsInputsPromises);
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
    logger.info(`Creating a new block with blockNumber ${nodeBlock.header.blockNumber}...`);
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
    logger.info(`Block #${nodeBlock.header.blockNumber} created.`);
    return block;
  }

  async addTransactionToBlock({
    block,
    nodeTransaction,
    transactionHash,
    transactionIndex,
    dbTransaction,
  } = {}) {
    logger.info(`Creating a new transaction for block #${block.blockNumber}...`);
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
    logger.info(
      `Transaction created for block #${block.blockNumber}. id=${transaction.id} hash=${
        transaction.hash
      }`
    );

    logger.info(`Adding transaction with id=${transaction.id} to block #${block.blockNumber}...`);
    await blocksDAL.addTransaction(block, transaction, { transaction: dbTransaction });
    logger.info(`Transaction with id=${transaction.id} added to block #${block.blockNumber}`);
    return transaction;
  }

  async addOutputToTransaction({ transaction, nodeOutput, outputIndex, dbTransaction }) {
    logger.info(
      `Creating a new output for transactionId=#${transaction.id} with hash ${transaction.hash}...`
    );
    const { lockType, address } = this.getLockValuesFromOutput(nodeOutput);
    const addressBC = address;
    let addressWallet = null;
    if (addressBC) {
      addressWallet = this.getAddressFromBCAddress(addressBC);
    }
    const output = await outputsDAL.create(
      {
        lockType,
        addressBC,
        address: addressWallet,
        contractLockVersion: 0,
        asset: nodeOutput.spend ? nodeOutput.spend.asset : null,
        amount: nodeOutput.spend ? nodeOutput.spend.amount : null,
        index: outputIndex,
      },
      { transaction: dbTransaction }
    );
    logger.info(
      `Output created for transactionId=#${transaction.id} with hash ${transaction.hash}.`
    );

    logger.info(`Adding output with id=${output.id} to transaction #${transaction.id}...`);
    await transactionsDAL.addOutput(transaction, output, { transaction: dbTransaction });
    logger.info(`Output with id=${output.id} added to transaction #${transaction.id}.`);

    return output;
  }

  getLockValuesFromOutput(nodeOutput) {
    let lockType = null;
    let address = null;
    if (nodeOutput.lock && typeof nodeOutput.lock !== 'object') {
      lockType = nodeOutput.lock;
    } else if (nodeOutput.lock && Object.keys(nodeOutput.lock).length) {
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

    return { lockType, address };
  }

  async addInputToTransaction({ transaction, nodeInput, inputIndex, dbTransaction }) {
    let input = null;

    if (nodeInput.outpoint) {
      input = await this.createOutpointInput({ transaction, nodeInput, inputIndex, dbTransaction });
    } else if (nodeInput.mint) {
      input = await this.createMintInput({ transaction, nodeInput, inputIndex, dbTransaction });
    } else {
      throw new Error('Input is invalid');
    }

    logger.info(`Adding input with id=${input.id} to transaction #${transaction.id}...`);
    await transactionsDAL.addInput(transaction, input, { transaction: dbTransaction });
    logger.info(`Input with id=${input.id} added to transaction #${transaction.id}.`);

    return input;
  }

  async createMintInput({ transaction, nodeInput, inputIndex, dbTransaction }) {
    if (!this.isMintInputValid(nodeInput)) {
      throw new Error(`Mint input not valid in transaction with hash=${transaction.hash}`);
    }

    logger.info(
      `Creating a new mint input for transactionId=${transaction.id} with hash ${
        transaction.hash
      }...`
    );
    const input = await inputsDAL.create(
      {
        index: inputIndex,
        isMint: true,
        asset: nodeInput.mint.asset,
        amount: Number(nodeInput.mint.amount),
      },
      { transaction: dbTransaction }
    );
    logger.info(`Mint input created for transactionId=${transaction.id}. id=${input.id}`);

    return input;
  }

  isMintInputValid(nodeInput) {
    const asset = nodeInput.mint.asset;
    const amount = nodeInput.mint.amount;
    return asset && typeof amount !== 'undefined' && amount !== null && !isNaN(Number(amount));
  }

  async createOutpointInput({ transaction, nodeInput, inputIndex, dbTransaction }) {
    if (!this.isOutpointInputValid(nodeInput)) {
      throw new Error(`Outpoint input not valid in transaction with hash=${transaction.hash}`);
    }

    logger.info(
      `Creating a new outpoint input for transactionId=#${transaction.id} with hash ${
        transaction.hash
      }...`
    );
    const input = await inputsDAL.create(
      {
        index: inputIndex,
        outpointTXHash: nodeInput.outpoint.txHash,
        outpointIndex: Number(nodeInput.outpoint.index),
        isMint: false,
      },
      { transaction: dbTransaction }
    );
    logger.info(`Outpoint input created for transactionId=#${transaction.id}. id=${input.id}`);

    return input;
  }

  isOutpointInputValid(nodeInput) {
    const txHash = nodeInput.outpoint.txHash;
    const index = nodeInput.outpoint.index;
    return txHash && typeof index !== 'undefined' && index !== null && !isNaN(Number(index));
  }

  /**
   * Should run after all the blocks are already in the database
   */
  async relateAllOutpointInputsToOutputs({ dbTransaction, blockIds } = {}) {
    logger.info(`Searching for all outpoint inputs in blocks ${blockIds}`);
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
    logger.info(`Found ${inputs.length} outpoint inputs that need to be related to outputs`);
    const relateInputToOutputPromises = inputs.map(input => {
      return this.relateInputToOutput({ input, dbTransaction });
    });
    const results = await Promise.all(relateInputToOutputPromises);
    return results;
  }

  async relateInputToOutput({ input, dbTransaction } = {}) {
    let output = null;

    logger.info(
      `Searching for the relevant output for InputId=${input.id} in transaction with hash=${
        input.outpointTXHash
      } and index=${input.outpointIndex}...`
    );
    const transactionsWithRelevantHash = await transactionsDAL.findAll(
      {
        where: {
          hash: input.outpointTXHash,
        },
        transaction: dbTransaction
      },
    );
    if (transactionsWithRelevantHash.length === 1) {
      const outputs = await outputsDAL.findAll(
        {
          where: {
            index: input.outpointIndex,
            TransactionId: transactionsWithRelevantHash[0].id,
          },
          transaction: dbTransaction 
        },
      );
      if (outputs.length === 1) {
        logger.info(`Found output for InputId=${input.id}`);
        output = outputs[0];
      } else {
        outputs.length > 0
          ? logger.error(`Found more than 1 related output for InputId=${input.id}!`)
          : logger.error(`Did not find an output for InputId=${input.id}`);
        throw new Error(`Output not found for InputId=${input.id}`);
      }
    } else {
      transactionsWithRelevantHash.length > 0
        ? logger.error(
            `Found more than 1 transactions with hash=${input.outpointTXHash} for InputId=${
              input.id
            }!`
          )
        : logger.error(
            `Could not find a transaction with hash=${input.outpointTXHash} for InputId=${input.id}`
          );
      throw new Error(`Output not found for InputId=${input.id}`);
    }

    logger.info(
      `Setting the found output with id=${output.id} on the input with id=${input.id}...`
    );
    await inputsDAL.setOutput(input, output, { transaction: dbTransaction });
    logger.info(`Output with id=${output.id} was set on the input with id=${input.id}.`);
    return true;
  }
}

module.exports = BlocksAdder;
