'use strict';

const { Decimal } = require('decimal.js');
const db = require('../../../server/db/sequelize/models');
const QueueError = require('../../lib/QueueError');
const zpSupplyPerDayDAL = require('../../../server/components/api/zp-supply-per-day/zpSupplyPerDayDAL');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');

class ZpSupplyPerDayCalc {
  constructor() {
    this.dbTransaction = null;
  }

  async doJob() {
    try {
      let result = 0;

      const [lastZpSupplyPerDay, firstBlock, lastBlock] = await Promise.all([
        zpSupplyPerDayDAL.findLatest(),
        blocksDAL.findFirst(),
        blocksDAL.findLatest(),
      ]);

      // do nothing if blocks table is empty
      if (lastBlock) {
        this.dbTransaction = await db.sequelize.transaction();

        const lastBlockDate = new Date(Number(lastBlock.timestamp));
        const firstBlockDate = new Date(Number(firstBlock.timestamp));
        let lastDateForJob = new Date(getDateString(firstBlockDate));

        // update the last row in ZpSupplyPerDay is exists
        if (lastZpSupplyPerDay) {
          lastDateForJob = new Date(lastZpSupplyPerDay.date);

          await lastZpSupplyPerDay.update({ value: await this.getRewardSumForDay(lastDateForJob) });
          result += 1;

          // go to next day
          lastDateForJob.setDate(lastDateForJob.getDate() + 1);
        }

        // up to the current block, move by days, fetch all blocks for the specific date, insert
        for (let date = lastDateForJob; date <= lastBlockDate; date.setDate(date.getDate() + 1)) {
          await zpSupplyPerDayDAL.create(
            {
              date: getDateString(date),
              value: await this.getRewardSumForDay(date),
            },
            { transaction: this.dbTransaction }
          );
          result += 1;
        }

        await this.dbTransaction.commit();
      }
      return result;
    } catch (error) {
      if (this.dbTransaction) {
        await this.dbTransaction.rollback();
      }
      throw new QueueError(error);
    }
  }

  /**
   * Get the sum of the reward for the day + the prev day sum in ZP
   * @param {Date} date
   */
  async getRewardSumForDay(date) {
    const prevDay = new Date(date.valueOf());
    prevDay.setDate(date.getDate() - 1);
    const [prevDayZpSupply, blocks] = await Promise.all([
      zpSupplyPerDayDAL.findOne({
        where: { date: getDateString(prevDay) },
        transaction: this.dbTransaction,
      }),
      blocksDAL.findByDay({ dateString: getDateString(date) }),
    ]);
    return blocks
      .reduce(
        (sum, cur) => (sum = sum.plus(new Decimal(cur.reward).dividedBy(100000000))),
        new Decimal(0)
      )
      .plus(prevDayZpSupply ? prevDayZpSupply.value : 0)
      .toNumber();
  }
}

module.exports = ZpSupplyPerDayCalc;

/**
 * Get an iso format string (2020-09-17)
 * @param {Date} d
 */
function getDateString(d) {
  const day = d.getDate();
  const month = d.getMonth() + 1;

  const dayStr = day > 9 ? String(day) : `0${day}`;
  const monthStr = month > 9 ? String(month) : `0${month}`;
  return `${d.getFullYear()}-${monthStr}-${dayStr}`;
}
