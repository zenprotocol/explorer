/**
 * Search the blocks table for reorgs
 * Will return the first fork it finds
 * Flags:
 * -a | --all - search the whole blocks and return all of the found forks
 */
const ReorgProcessor = require('../jobs/blocks/ReorgProcessor');
const sequelize = require('../../server/db/sequelize/models').sequelize;
const NetworkHelper = require('../lib/NetworkHelper');
const logger = require('../lib/logger');
const reorgProcessor = new ReorgProcessor(new NetworkHelper());

const run = async () => {
  logger.info('Searching fork...');
  const forks = [];
  let fork = await searchFork();
  if (fork > -1) {
    forks.push(fork);
  }

  if(searchAll()) {
    while(fork > 0) {
      fork = await searchFork(fork);
      if (fork > -1) {
        forks.push(fork);
      }
    }
  }

  return forks;
};

async function searchFork(startAt) {
  const fork = await reorgProcessor.searchFork(startAt, 1);
  if(fork > -1) {
    logger.info(`Fork found at block number ${fork}`);
  }
  return fork;
}

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