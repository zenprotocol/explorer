'use strict';

const R = require('ramda');
const logger = require('../../lib/logger')('commands');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const transactionsDAL = require('../../../server/components/api/transactions/transactionsDAL');
const commandsDAL = require('../../../server/components/api/commands/commandsDAL');
const getJobData = require('../../lib/getJobData');
const QueueError = require('../../lib/QueueError');

const DEFAULT_NUM_OF_COMMANDS_TO_TAKE = 100;

function filterOutZeroConfirmations(nodeCommands) {
  return R.filter(command => command.confirmations > 0, nodeCommands);
}

class CommandsAdder {
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
      const numOfCommandsToTake = getJobData(job, 'take') || DEFAULT_NUM_OF_COMMANDS_TO_TAKE;
      // Non active contracts can not add commands
      const activeContracts = await contractsDAL.findAllActive();
      if (!activeContracts.length) {
        logger.info('There are no active contracts at the moment - aborting');
        return 0;
      }

      logger.info('Updating active contracts commands');
      const numOfRowsAffected = await this.processContracts(activeContracts, numOfCommandsToTake);
      logger.info(
        `Commands for active contracts updated - ${numOfRowsAffected} number of rows affected`
      );
      return numOfRowsAffected;
    } catch (error) {
      logger.error(`An Error has occurred when processing commands: ${error.message}`);
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
  async processContracts(contracts, numOfCommandsToTake = DEFAULT_NUM_OF_COMMANDS_TO_TAKE) {
    const promises = [];
    contracts.forEach(contract =>
      promises.push(this.getCommandsToInsert(contract.id, numOfCommandsToTake))
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
    await commandsDAL.bulkCreate(finalItemsToInsert);

    return finalItemsToInsert.length;
  }

  /**
   * Get the commands from the node
   * filter out the commands with no confirmations
   * skip the amount of commands already in db
   * assuming that the results from the node are ordered by block, older first!
   *
   * @param {string} contractId
   * @param {number} numOfCommandsToTake num of commands to take from the node each round
   * @returns an array of commands to insert
   */
  async getCommandsToInsert(contractId, numOfCommandsToTake) {
    if (numOfCommandsToTake === 0) {
      throw new Error('numOfCommandsToTake must be bigger than zero!');
    }
    const commandsAlreadyInDb = await contractsDAL.countCommands(contractId);
    let commandsTakenCount = 0;
    const commandsToInsert = [];
    let hasMoreCommands = true;
    while (hasMoreCommands) {
      const commands = await this.networkHelper.getContractCommandsFromNode({
        contractId,
        skip: commandsAlreadyInDb + commandsTakenCount,
        take: numOfCommandsToTake,
      });
      const commandsWithConfirmations = filterOutZeroConfirmations(commands);
      const mappedCommands = await this.mapNodeCommandsWithRelations(
        contractId,
        commandsWithConfirmations
      );
      commandsToInsert.push.apply(commandsToInsert, mappedCommands); // flat mappedCommands and push into commandsToInsert
      commandsTakenCount += commandsWithConfirmations.length;
      if (commandsWithConfirmations.length < numOfCommandsToTake) {
        hasMoreCommands = false;
      }
    }

    return commandsToInsert;
  }

  /**
   * Map the commands from the node to an object for the database
   * Include the transaction id
   *
   * @param {string} contractId
   * @param {Array} commands
   * @returns {Array} an array of objects
   */
  async mapNodeCommandsWithRelations(contractId, commands) {
    // indexInTransaction can not currently be calculated as the results from address db are ordered by command name
    const mappedCommands = [];
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      const tx = await transactionsDAL.findOne({ where: { hash: command.txHash } });
      if (!tx) {
        logger.error(
          `Could not find a referenced tx with hash=${command.txHash}, contractId=${contractId}`
        );
      } else {
        mappedCommands.push({
          command: command.command,
          messageBody: JSON.stringify(command.messageBody),
          TransactionId: tx.id,
          indexInTransaction: 0, // can not calculate for now!
          ContractId: contractId,
        });
      }
    }

    return mappedCommands;
  }

  async getLastCommandTxIndexFromDb(contractId, txHash) {
    const lastCommand = await contractsDAL.getLastCommandOfTx(contractId, txHash);
    const indexInTransaction = (lastCommand || {}).indexInTransaction;
    return indexInTransaction !== undefined ? indexInTransaction : -1;
  }
}

module.exports = CommandsAdder;
