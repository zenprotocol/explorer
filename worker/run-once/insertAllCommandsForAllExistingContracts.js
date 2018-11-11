/**
 * Get all contracts in db and for each insert all commands
 */
const CommandsAdder = require('../jobs/commands/CommandsAdder');
const contractsDAL = require('../../server/components/api/contracts/contractsDAL');
const NetworkHelper = require('../lib/NetworkHelper');
const logger = require('../lib/logger')('commands');
const commandsAdder = new CommandsAdder(new NetworkHelper());

const run = async () => {
  const contracts = await contractsDAL.findAll();
  logger.info(`Start adding commands for ${contracts.length} contracts`);
  return await commandsAdder.processContracts(contracts);
};

run()
  .then((commandsCount) => {
    logger.info(`Finished adding commands. Added ${commandsCount} commands.`);
  })
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    contractsDAL.db.sequelize.close();
  });
