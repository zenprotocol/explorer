/**
 * Take snapshots for all intervals that does not have a snapshot yet
 */
const SnapshotsTaker = require('../jobs/snapshots/SnapshotsTaker');
const logger = require('../lib/logger')('snapshots');
const db = require('../../server/db/sequelize/models');
const getChain = require('../../server/lib/getChain');

const run = async () => {
  const snapshotsTaker = new SnapshotsTaker({ chain: await getChain() });
  logger.info('Start taking snapshots');
  return await snapshotsTaker.doJob();
};

run()
  .then((result) => {
    logger.info(`Finished taking snapshots: ${JSON.stringify(result, null, 2)}`);
  })
  .catch((err) => {
    logger.error(`An Error has occurred: ${err.message}`);
  })
  .then(() => {
    db.sequelize.close();
  });
