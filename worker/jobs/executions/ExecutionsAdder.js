'use strict';

const R = require('ramda');
const logger = require('../../lib/logger')('executions');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const txsDAL = require('../../../server/components/api/txs/txsDAL');
const executionsDAL = require('../../../server/components/api/executions/executionsDAL');
const getJobData = require('../../lib/getJobData');
const QueueError = require('../../lib/QueueError');

const DEFAULT_NUM_OF_EXECUTIONS_TO_TAKE = 100;

function filterOutZeroConfirmations(nodeExecutions) {
  return R.filter((execution) => execution.confirmations > 0, nodeExecutions);
}

class ExecutionsAdder {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
  }

  async doJob(job) {
    try {
      const blocksAreSynced = await this.isBlocksSynced();
      if (!blocksAreSynced) {
        logger.info('Blocks are not yet synced - aborting');
        return 0;
      }
      const jobType = getJobData(job, 'type'); // should execute lengthy operations?
      const numOfExecutionsToTake = getJobData(job, 'take') || DEFAULT_NUM_OF_EXECUTIONS_TO_TAKE;
      const contracts =
        jobType === 'expensive' ? await contractsDAL.findAll() : await contractsDAL.findAllActive();
      if (!contracts.length) {
        logger.info(
          `No ${jobType === 'expensive' ? '' : 'active '}contracts found in DB - aborting`
        );
        return 0;
      }

      logger.info('Updating contracts executions');
      const numOfRowsAffected = await this.processContracts(contracts, numOfExecutionsToTake);
      logger.info(
        `Executions for contracts updated - ${numOfRowsAffected} number of rows affected`
      );
      return numOfRowsAffected;
    } catch (error) {
      logger.error(`An Error has occurred when processing executions: ${error.message}`);
      throw new QueueError(error);
    }
  }

  async isBlocksSynced() {
    const latestBlockInDB = await blocksDAL.findLatest();
    const latestBlockNumberInDB = latestBlockInDB ? latestBlockInDB.blockNumber : 0;
    const latestBlockNumberInNode = await this.networkHelper.getLatestBlockNumberFromNode();
    return latestBlockNumberInDB === latestBlockNumberInNode;
  }

  /**
   * Process a list of contracts
   *
   * @param {Array} contracts
   */
  async processContracts(contracts, numOfExecutionsToTake = DEFAULT_NUM_OF_EXECUTIONS_TO_TAKE) {
    const promises = [];
    contracts.forEach((contract) =>
      promises.push(this.getExecutionsToInsert(contract.id, numOfExecutionsToTake))
    );
    const results = await Promise.all(promises);
    const finalResults = [];
    for (let i = 0; i < results.length; i++) {
      const contractResults = results[i];
      if (contractResults.length) {
        finalResults.push(contractResults);
      }
    }

    const finalItemsToInsert = finalResults.reduce((all, cur) => all.concat(cur), []); // concat all arrays together
    await executionsDAL.bulkCreate(finalItemsToInsert);

    return finalItemsToInsert.length;
  }

  /**
   * Get the executions from the node
   * filter out the executions with no confirmations
   * skip the amount of executions already in db
   * assuming that the results from the node are ordered by block, older first!
   *
   * @param {string} contractId
   * @param {number} numOfExecutionsToTake num of executions to take from the node each round
   * @returns an array of executions to insert
   */
  async getExecutionsToInsert(contractId, numOfExecutionsToTake) {
    if (numOfExecutionsToTake === 0) {
      throw new Error('numOfExecutionsToTake must be bigger than zero!');
    }
    const executionsAlreadyInDb = await contractsDAL.countExecutions(contractId);
    let executionsTakenCount = 0;
    const executionsToInsert = [];
    let hasMoreExecutions = true;
    while (hasMoreExecutions) {
      const executions = await this.networkHelper.getContractExecutionsFromNode({
        contractId,
        skip: executionsAlreadyInDb + executionsTakenCount,
        take: numOfExecutionsToTake,
      });
      const executionsWithConfirmations = filterOutZeroConfirmations(executions);
      const mappedExecutions = await this.mapNodeExecutionsWithRelations(
        contractId,
        executionsWithConfirmations
      );
      executionsToInsert.push.apply(executionsToInsert, mappedExecutions); // flat mappedExecutions and push into executionsToInsert
      executionsTakenCount += executionsWithConfirmations.length;
      if (executionsWithConfirmations.length < numOfExecutionsToTake) {
        hasMoreExecutions = false;
      }
    }

    return executionsToInsert;
  }

  /**
   * Map the executions from the node to an object for the database
   * Include the transaction id
   *
   * @param {string} contractId
   * @param {Array} executions
   * @returns {Array} an array of objects
   */
  async mapNodeExecutionsWithRelations(contractId, executions) {
    // indexInTx can not currently be calculated as the results from address db are ordered by execution name
    const mappedExecutions = [];
    for (let i = 0; i < executions.length; i++) {
      const execution = executions[i];

      const tx = await txsDAL.findOne({ where: { hash: execution.txHash } });
      if (!tx) {
        logger.error(
          `Could not find a referenced tx with hash=${execution.txHash}, contractId=${contractId}`
        );
      } else {
        mappedExecutions.push({
          contractId: contractId,
          blockNumber: tx.blockNumber,
          txId: tx.id,
          command: execution.command,
          messageBody: JSON.stringify(execution.messageBody),
          indexInTx: 0, // can not calculate for now!
        });
      }
    }

    return mappedExecutions;
  }

  async getLastExecutionTxIndexFromDb(contractId, txHash) {
    const lastExecution = await contractsDAL.getLastExecutionOfTx(contractId, txHash);
    const indexInTx = (lastExecution || {}).indexInTx;
    return indexInTx !== undefined ? indexInTx : -1;
  }
}

module.exports = ExecutionsAdder;
