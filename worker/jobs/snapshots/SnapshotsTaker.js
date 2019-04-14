'use strict';

const logger = require('../../lib/logger')('snapshots');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const addressesDAL = require('../../../server/components/api/addresses/addressesDAL');
const voteIntervalsDAL = require('../../../server/components/api/voteIntervals/voteIntervalsDAL');
const snapshotsDAL = require('../../../server/components/api/snapshots/snapshotsDAL');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');

/**
 * Responsible for taking snapshots based on the vote intervals and the current block number in db
 */
class SnapshotsTaker {
  async doJob() {
    try {
      let dbTransaction = null;
      let result = [];
      const latestBlockNumberInDb = await this.getLatestBlockNumberInDB();
      // get all voteIntervals which don't have a snapshot and height <= latest
      const voteIntervals = await voteIntervalsDAL.findAllWithoutSnapshot(latestBlockNumberInDb);

      // for each of those intervals, create a snapshot and update hasSnapshot to true
      if (voteIntervals.length) {
        dbTransaction = await db.sequelize.transaction();
        for (let i = 0; i < voteIntervals.length; i++) {
          const voteInterval = voteIntervals[i];
          logger.info(
            `Taking snapshot for vote intervals with beginHeight ${voteInterval.beginHeight}`
          );
          const snapshotRows = await this.getAddressesAmountsForHeight(voteInterval.beginHeight);
          await snapshotsDAL.bulkCreate(snapshotRows, { transaction: dbTransaction });
          // mark this interval as has a snapshot
          await voteIntervalsDAL.setHasSnapshot(voteInterval.id);
          result.push({
            voteInterval,
            snapshotCount: snapshotRows.length,
          });
          logger.info(
            `Finished taking snapshot for height ${voteInterval.beginHeight}, snapshot has ${
              snapshotRows.length
            } addresses`
          );
        }
        await dbTransaction.commit();
      }
      return result;
    } catch (error) {
      logger.error(`An Error has occurred when adding a snapshot: ${error.message}`);
      throw new QueueError(error);
    }
  }

  async getLatestBlockNumberInDB() {
    let blockNumber = 0;
    const latestBlockInDB = await blocksDAL.findLatest();
    if (latestBlockInDB) {
      blockNumber = latestBlockInDB.blockNumber;
    }
    return blockNumber;
  }

  /**
   * Get snapshot data ready for bulkCreate
   */
  async getAddressesAmountsForHeight(height = 0) {
    const addressesAmounts = await addressesDAL.snapshotBalancesByBlock(height);
    // add height to the results so it will be easier to insert
    return addressesAmounts.map(row => Object.assign({}, row, { height }));
  }
}

module.exports = SnapshotsTaker;
