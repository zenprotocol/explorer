/**
 * Get all contracts in db and for each insert all commands
 */
const logger = require('../lib/logger')('cgp-winner');
const getChain = require('../../server/lib/getChain');
const cgpIntervalDAL = require('../../server/components/api/cgp/cgpIntervalDAL');
const CGPWinnerCalculator = require('../jobs/votes/CGPWinnerCalculator/CGPWinnerCalculator');

const run = async () => {
  logger.info('deleting all cgp intervals');
  await cgpIntervalDAL.bulkDelete({truncate: true});

  const chain = await getChain();
  const winnerCalculator = new CGPWinnerCalculator({chain});
  logger.info('Start cgp winner job');
  return winnerCalculator.doJob();
};

run()
  .then((result) => {
    logger.info(`Added ${result} cgp intervals.`);
  })
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    cgpIntervalDAL.db.sequelize.close();
  });
