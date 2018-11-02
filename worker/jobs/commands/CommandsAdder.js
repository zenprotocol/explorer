'use strict';

const logger = require('../../lib/logger');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const transactionsDAL = require('../../../server/components/api/transactions/transactionsDAL');
const commandsDAL = require('../../../server/components/api/commands/commandsDAL');
const getJobData = require('../../lib/getJobData');

const DEFAULT_NUM_OF_COMMANDS_TO_TAKE = 100;

class CommandsAdder {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
  }

  async doJob(job) {
    try {
      logger.info('Updating active contracts commands');
      const numOfCommandsToTake = getJobData(job, 'take') || DEFAULT_NUM_OF_COMMANDS_TO_TAKE;
      // the worker processes active contracts only - as non active ones can not add commands
      const activeContracts = await contractsDAL.findAllActive();
      const numOfRowsAffected = await this.processContracts(activeContracts, numOfCommandsToTake);
      logger.info(`Active contracts updated - ${numOfRowsAffected} number of rows affected`);
      return numOfRowsAffected;
    } catch (error) {
      logger.error(`An Error has occurred when processing commands: ${error.message}`);
      throw error;
    }
  }

  async processContracts(contracts, numOfCommandsToTake = DEFAULT_NUM_OF_COMMANDS_TO_TAKE) {
    const promises = [];
    contracts.forEach(contract =>
      promises.push(this.getCommandsToInsert(contract.id, numOfCommandsToTake))
    );
    const results = await Promise.all(promises);

    const finalItemsToInsert = results.reduce((all, cur) => all.concat(cur), []);
    await commandsDAL.bulkCreate(finalItemsToInsert);

    return finalItemsToInsert.length;
  }

  async getCommandsToInsert(contractId, numOfCommandsToTake) {
    if (numOfCommandsToTake === 0) {
      throw new Error('numOfCommandsToTake must be bigger than zero!');
    }
    const commandCountInDb = await contractsDAL.countCommands(contractId);
    let commandsTakenCount = 0;

    const commandsToInsert = [];
    let hasMoreCommands = true;
    while (hasMoreCommands) {
      const commands = await this.networkHelper.getContractCommandsFromNode({
        contractId,
        skip: commandCountInDb + commandsTakenCount,
        take: numOfCommandsToTake,
      });
      const mappedCommands = await this.mapNodeCommandsWithRelations(contractId, commands);
      commandsToInsert.push.apply(commandsToInsert, mappedCommands);
      commandsTakenCount += commands.length;
      if (commands.length < numOfCommandsToTake) {
        hasMoreCommands = false;
      }
    }

    return commandsToInsert;
  }

  async mapNodeCommandsWithRelations(contractId, commands) {
    let currentIxHash = '';
    let currentTxIndex = 0;
    const promises = [];
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (currentIxHash !== command.txHash) {
        const lastTxIndex = await this.getLastCommandTxIndexFromDb(contractId, command.txHash);
        currentIxHash = command.txHash;
        currentTxIndex = lastTxIndex + 1;
      }
      let localIxHash = currentIxHash;
      let localTxIndex = currentTxIndex;
      currentTxIndex += 1;

      promises.push(
        (async () => {
          const tx = await transactionsDAL.findOne({ where: { hash: localIxHash } });
          if (!tx) {
            logger.error(`Error - could not find a referenced tx with hash=${localIxHash}`);
          }
          return {
            command: command.command,
            messageBody: command.messageBody,
            TransactionId: tx.id,
            indexInTransaction: localTxIndex,
            ContractId: contractId,
          };
        })()
      );
    }

    return Promise.all(promises);
  }

  async getLastCommandTxIndexFromDb(contractId, txHash) {
    const lastCommand = await contractsDAL.getLastCommandOfTx(contractId, txHash);
    const indexInTransaction = (lastCommand || {}).indexInTransaction;
    return indexInTransaction !== undefined ? indexInTransaction : -1;
  }
}

module.exports = CommandsAdder;
