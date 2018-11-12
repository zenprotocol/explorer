/**
 * Search the blocks table for reorgs
 * Will return the first fork it finds
 * Flags:
 * -a | --all - search the whole blocks and return all of the found forks
 */
const ReorgProcessor = require('../jobs/blocks/ReorgProcessor');
const sequelize = require('../../server/db/sequelize/models').sequelize;
const NetworkHelper = require('../lib/NetworkHelper');
const logger = require('../lib/logger')('reorg-search');
const reorgProcessor = new ReorgProcessor(new NetworkHelper());

reorgProcessor.on('scan-block', blockNumber => logger.info(`searching in block ${blockNumber}`));
reorgProcessor.on('fork-found', blockNumber => logger.info(`Fork found at block number ${blockNumber}`));

const run = async () => {
  logger.info('Searching forks...');
  const forks = await reorgProcessor.searchForks(searchAll());
  return forks;
};

run()
  .then((forks) => {
    let logMsg = 'Finished searching: ';
    if(forks.length) {
      logger.info(`${logMsg}Forks found at block numbers ${forks.join(', ')}`);
    }
    else {
      logger.info(`${logMsg}Did not find a fork`);
    }
  })
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    sequelize.close();
  });

function searchAll() {
  return process.argv.includes('-a') || process.argv.includes('--all');
}