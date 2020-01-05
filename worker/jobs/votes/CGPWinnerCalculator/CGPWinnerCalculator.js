'use strict';

const R = require('ramda');
const logger = require('../../../lib/logger')('cgp-winner');
const QueueError = require('../../../lib/QueueError');
const db = require('../../../../server/db/sequelize/models');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const cgpDAL = require('../../../../server/components/api/cgp/cgpDAL');
const cgpIntervalDAL = require('../../../../server/components/api/cgp/cgpIntervalDAL');
const cgpUtils = require('../../../../server/components/api/cgp/cgpUtils');
const {
  addBallotContentToResults,
} = require('../../../../server/components/api/cgp/modules/addBallotContentToResults');
const calculateWinnerAllocation = require('./modules/calculateWinnerAllocation');
const calculateWinnerPayout = require('./modules/calculateWinnerPayout');

class CGPWinnerCalculator {
  constructor({ chain } = {}) {
    this.chain = chain;
  }

  async doJob() {
    let dbTransaction = null;
    try {
      let result = 0;
      const latestBlockNumberInDB = await this.getLatestBlockNumberInDB();
      const latestIntervalInDB = await this.getLatestIntervalInDB();
      const intervalLength = cgpUtils.getIntervalLength(this.chain);
      const coinbaseMaturity = cgpUtils.getCoinbaseMaturity(this.chain);
      const { tally: latestInDbTally } = cgpUtils.getIntervalBlocks(this.chain, latestIntervalInDB); // latestIntervalInDB=0 gives tally = 0
      const currentInterval = cgpUtils.getIntervalByBlockNumber(this.chain, latestBlockNumberInDB);

      if (latestBlockNumberInDB >= latestInDbTally + intervalLength + coinbaseMaturity) {
        dbTransaction = await db.sequelize.transaction();

        for (let interval = latestIntervalInDB + 1; interval < currentInterval; interval++) {
          const intervalBlocks = cgpUtils.getIntervalBlocks(this.chain, interval);
          const calculatedAtBlockNumber = intervalBlocks.tally + coinbaseMaturity;
          if (latestBlockNumberInDB >= calculatedAtBlockNumber) {
            // find all vote results and add ballot content, find block
            const [resultsAllocation, resultsPayout, block] = await Promise.all([
              cgpDAL
                .findAllVoteResults({
                  snapshot: intervalBlocks.snapshot,
                  tally: intervalBlocks.tally,
                  type: 'allocation',
                })
                .then(addBallotContentToResults({ type: 'allocation', chain: this.chain })),
              cgpDAL
                .findAllVoteResults({
                  snapshot: intervalBlocks.snapshot,
                  tally: intervalBlocks.tally,
                  type: 'payout',
                  limit: 2,
                })
                .then(addBallotContentToResults({ type: 'payout', chain: this.chain })),
              blocksDAL.findByBlockNumber(calculatedAtBlockNumber),
            ]);

            // create the interval
            await cgpIntervalDAL.create(
              {
                interval,
                calculatedAtBlockId: block.id,
                winnerAllocation: JSON.stringify(calculateWinnerAllocation(resultsAllocation)),
                winnerPayout: JSON.stringify(calculateWinnerPayout(resultsPayout)),
              },
              { transaction: dbTransaction }
            );
            result += 1;
            logger.info(`Created cgp interval ${interval}`);
          }
        }
      }

      if(dbTransaction) {
        await dbTransaction.commit();
      }

      return result;
    } catch (error) {
      logger.error(`An Error has occurred when calculating cgp winner: ${error.message}`);
      if (dbTransaction) {
        await dbTransaction.rollback();
      }
      throw new QueueError(error);
    }
  }

  async getLatestBlockNumberInDB() {
    const latestBlockInDB = await blocksDAL.findLatest();
    return latestBlockInDB ? latestBlockInDB.blockNumber : 0;
  }
  async getLatestIntervalInDB() {
    const latestIntervalInDB = await cgpIntervalDAL.findOne({
      order: [['interval', 'DESC']],
    });
    return latestIntervalInDB ? latestIntervalInDB.interval : 0;
  }
}

module.exports = CGPWinnerCalculator;
