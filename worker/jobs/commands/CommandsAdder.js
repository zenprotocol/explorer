'use strict';

const logger = require('../../lib/logger')('commands');
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
      logger.info(`Commands for active contracts updated - ${numOfRowsAffected} number of rows affected`);
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
    const finalResults = [];
    for (let i = 0; i < results.length; i++) {
      const contractResults = results[i];
      if(contractResults.length && await this.shouldInsertCommands(contractResults[0].ContractId, contractResults)) {
        await contractsDAL.deleteCommands(contractResults[0].ContractId);
        finalResults.push(contractResults);
      }
    }

    const finalItemsToInsert = finalResults.reduce((all, cur) => all.concat(cur), []);
    await commandsDAL.bulkCreate(finalItemsToInsert);

    return finalItemsToInsert.length;
  }

  async shouldInsertCommands(contractId, commandsToInsert) {
    const dbCommandsCount = await contractsDAL.countCommands(contractId);
    return dbCommandsCount !== commandsToInsert.length;
  }

  async getCommandsToInsert(contractId, numOfCommandsToTake) {
    if (numOfCommandsToTake === 0) {
      throw new Error('numOfCommandsToTake must be bigger than zero!');
    }
    let commandsTakenCount = 0;
    const commandsToInsert = [];
    let hasMoreCommands = true;
    while (hasMoreCommands) {
      const commands = await this.networkHelper.getContractCommandsFromNode({
        contractId,
        skip: commandsTakenCount,
        take: numOfCommandsToTake,
      });
      const mappedCommands = await this.mapNodeCommandsWithRelations(contractId, commands);
      commandsToInsert.push.apply(commandsToInsert, mappedCommands); // push into same array
      commandsTakenCount += commands.length;
      if (commands.length < numOfCommandsToTake) {
        hasMoreCommands = false;
      }
    }

    return commandsToInsert;
  }

  async mapNodeCommandsWithRelations(contractId, commands) {
    // indexInTransaction can not currently be calculated as the results from address db are ordered by command name
    const promises = [];
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];

      promises.push(
        (async () => {
          const tx = await transactionsDAL.findOne({ where: { hash: command.txHash } });
          if (!tx) {
            logger.error(`Error - could not find a referenced tx with hash=${command.txHash}`);
          }
          return {
            command: command.command,
            messageBody: command.messageBody,
            TransactionId: tx.id,
            indexInTransaction: 0, // can not calculate for now!
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
