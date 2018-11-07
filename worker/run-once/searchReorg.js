const ReorgProcessor = require('../jobs/blocks/ReorgProcessor');
const sequelize = require('../../server/db/sequelize/models').sequelize;
const NetworkHelper = require('../lib/NetworkHelper');
const logger = require('../lib/logger');
const reorgProcessor = new ReorgProcessor(new NetworkHelper());

const run = async () => {
  logger.info('Searching fork...');
  return await reorgProcessor.searchFork();
};

run()
  .then((fork) => {
    if(fork > -1) {
      logger.info(`Fork found at block number ${fork}`);
    }
    else {
      logger.info('Did not find a fork');
    }
  })
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    sequelize.close();
  });