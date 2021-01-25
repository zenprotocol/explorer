/**
 * Get all contracts in db and for each insert all executions
 */
const ExecutionsAdder = require('../jobs/executions/ExecutionsAdder');
const contractsDAL = require('../../server/components/api/contracts/contractsDAL');
const NetworkHelper = require('../lib/NetworkHelper');
const logger = require('../lib/logger')('executions');
const executionsAdder = new ExecutionsAdder(new NetworkHelper());

const run = async () => {
  const contracts = await contractsDAL.findAll();
  logger.info(`Start adding executions for ${contracts.length} contracts`);
  return await executionsAdder.processContracts(contracts);
};

run()
  .then((executionsCount) => {
    logger.info(`Finished adding executions. Added ${executionsCount} executions.`);
  })
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    contractsDAL.db.sequelize.close();
  });
