'use strict';

const db = require('../../../server/db/sequelize/models');
const QueueError = require('../../lib/QueueError');
const difficultyPerDayDAL = require('../../../server/components/api/difficulty-per-day/difficultyPerDayDAL');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');

class DifficultyPerDayCalc {
  constructor() {
    this.dbTransaction = null;
  }

  async doJob() {
    try {
      let result = 0;

      const [lastDifficultyPerDay, firstBlock, lastBlock] = await Promise.all([
        difficultyPerDayDAL.findLatest(),
        blocksDAL.findFirst(),
        blocksDAL.findLatest(),
      ]);

      // do nothing if blocks table is empty
      if (lastBlock) {
        this.dbTransaction = await db.sequelize.transaction();

        const lastBlockDate = new Date(Number(lastBlock.timestamp));
        const firstBlockDate = new Date(Number(firstBlock.timestamp));
        let lastDateForJob = new Date(getDateString(firstBlockDate));

        // update the last row in DifficultyPerDay is exists
        if (lastDifficultyPerDay) {
          lastDateForJob = new Date(lastDifficultyPerDay.date);

          await lastDifficultyPerDay.update({ value: await this.getDifficultyCalculationForDay(lastDateForJob) });
          result += 1;

          // go to next day
          lastDateForJob.setDate(lastDateForJob.getDate() + 1);
        }

        // up to the current block, move by days, fetch all blocks for the specific date, insert
        for (let date = lastDateForJob; date <= lastBlockDate; date.setDate(date.getDate() + 1)) {
          await difficultyPerDayDAL.create(
            {
              date: getDateString(date),
              value: await this.getDifficultyCalculationForDay(date),
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
   * Calculate the difficulty per day for a date
   * @param {Date} date
   */
  async getDifficultyCalculationForDay(date) {
    const result = await blocksDAL.findDifficultyForDay({ dateString: getDateString(date) });
    return result.length ? result[0].difficulty || 0 : 0;
  }
}

module.exports = DifficultyPerDayCalc;

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
