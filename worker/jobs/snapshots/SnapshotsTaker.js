'use strict';

const logger = require('../../lib/logger')('snapshots');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const addressesDAL = require('../../../server/components/api/addresses/addressesDAL');
const voteIntervalsDAL = require('../../../server/components/api/repovote-intervals/repoVoteIntervalsDAL');
const snapshotsDAL = require('../../../server/components/api/snapshots/snapshotsDAL');
const QueueError = require('../../lib/QueueError');
const db = require('../../../server/db/sequelize/models');
const config = require('../../../server/config/Config');

/**
 * Responsible for taking snapshots for VoteIntervals and the CGP
 */
class SnapshotsTaker {
  constructor({ chain } = {}) {
    this.chain = chain;
  }

  async doJob() {
    try {
      let result = { voteIntervals: null, cgp: null };
      const latestBlockNumberInDb = await this.getLatestBlockNumberInDB();
      result.voteIntervals = await this.snapshotByVoteIntervals(latestBlockNumberInDb);
      result.cgp = await this.snapshotByCGPIntervals(latestBlockNumberInDb);

      return result;
    } catch (error) {
      logger.error(`An Error has occurred when adding a snapshot: ${error.message}`);
      throw new QueueError(error);
    }
  }

  async snapshotByVoteIntervals(latestBlockNumberInDb) {
    let dbTransaction = null;
    try {
      let result = [];

      // get all voteIntervals which don't have a snapshot and height <= latest
      const voteIntervals = await voteIntervalsDAL.findAllWithoutSnapshot(latestBlockNumberInDb);

      // for each of those intervals, create a snapshot and update hasSnapshot to true
      if (voteIntervals.length) {
        dbTransaction = await db.sequelize.transaction();
        for (let i = 0; i < voteIntervals.length; i++) {
          const voteInterval = voteIntervals[i];
          logger.info(
            `Taking snapshot for vote intervals with beginBlock ${voteInterval.beginBlock}`
          );
          const snapshotRows = await this.getAddressesAmountsForHeight(voteInterval.beginBlock);
          await snapshotsDAL.bulkCreate(snapshotRows, { transaction: dbTransaction });
          // mark this interval as has a snapshot
          await voteIntervalsDAL.setHasSnapshot(voteInterval.id);
          result.push({
            interval: voteInterval.interval,
            snapshotCount: snapshotRows.length,
          });
          logger.info(
            `Finished taking VoteIntervals snapshot for height ${
              voteInterval.beginBlock
            }, snapshot has ${snapshotRows.length} addresses`
          );
        }
        await dbTransaction.commit();
      }
      return result;
    } catch (error) {
      if (dbTransaction) {
        logger.info('Rollback the database transaction');
        await dbTransaction.rollback();
      }
      throw error;
    }
  }

  async snapshotByCGPIntervals(latestBlockNumberInDb) {
    let dbTransaction = null;
    try {
      let result = [];

      const missingSnapshotHeights = await this.findMissingCGPSnapshotHeights(
        latestBlockNumberInDb
      );
      // for each of those intervals, create a snapshot
      if (missingSnapshotHeights.length) {
        dbTransaction = await db.sequelize.transaction();
        for (let i = 0; i < missingSnapshotHeights.length; i++) {
          const missingInterval = missingSnapshotHeights[i];
          logger.info(`Taking snapshot for blockNumber ${missingInterval.blockNumber}`);
          const snapshotRows = await this.getAddressesAmountsForHeight(missingInterval.blockNumber);
          await snapshotsDAL.bulkCreate(snapshotRows, { transaction: dbTransaction });
          result.push({
            interval: missingInterval.interval,
            snapshotCount: snapshotRows.length,
          });
          logger.info(
            `Finished taking snapshot for blockNumber ${missingInterval.blockNumber}, snapshot has ${
              snapshotRows.length
            } addresses`
          );
        }
        await dbTransaction.commit();
      }
      return result;
    } catch (error) {
      if (dbTransaction) {
        logger.info('Rollback the database transaction');
        await dbTransaction.rollback();
      }
      throw error;
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
  async getAddressesAmountsForHeight(blockNumber = 0) {
    const addressesAmounts = await addressesDAL.snapshotBalancesByBlock(blockNumber);
    // add blockNumber to the results so it will be easier to insert
    return addressesAmounts.map(row => Object.assign({}, row, { blockNumber }));
  }

  /**
   * Get an array with {interval, blockNumber} that don't have a snapshot
   * @param {number} height - the maximum height to check
   */
  async findMissingCGPSnapshotHeights(height) {
    const existingSnapshotHeights = await snapshotsDAL.findAllHeights();
    const intervalLength = config.get(`cgp:${this.chain}:intervalLength`);
    const numOfIntervals = Math.floor((height + intervalLength * 0.1) / intervalLength);
    const allNeededSnapshotHeights = new Array(numOfIntervals)
      .fill(1)
      .map((item, index) => ({
        interval: index + 1,
        blockNumber: intervalLength * 0.9 + index * intervalLength,
      }));

    return allNeededSnapshotHeights.filter(
      item => existingSnapshotHeights.indexOf(item.blockNumber) < 0
    );
  }
}

module.exports = SnapshotsTaker;
