'use strict';

const { Decimal } = require('decimal.js');
const db = require('../../../server/db/sequelize/models');
const QueueError = require('../../lib/QueueError');
const txsPerDayDAL = require('../../../server/components/api/txs-per-day/txsPerDayDAL');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');

class TxsPerDayCalc {
  constructor() {
    this.dbTransaction = null;
  }

  async doJob() {
    try {
      let result = 0;

      const [lastTxPerDay, firstBlock, lastBlock] = await Promise.all([
        txsPerDayDAL.findLatest(),
        blocksDAL.findFirst(),
        blocksDAL.findLatest(),
      ]);

      // do nothing if blocks table is empty
      if (lastBlock) {
        this.dbTransaction = await db.sequelize.transaction();

        const lastBlockDate = new Date(Number(lastBlock.timestamp));
        const firstBlockDate = new Date(Number(firstBlock.timestamp));
        let lastDateForJob = new Date(getDateString(firstBlockDate));

        // update the last row in TxsPerDay is exists
        if (lastTxPerDay) {
          lastDateForJob = new Date(lastTxPerDay.date);

          await lastTxPerDay.update({ value: await this.getTxsCountForDay(lastDateForJob) });
          result += 1;

          // go to next day
          lastDateForJob.setDate(lastDateForJob.getDate() + 1);
        }

        // up to the current block, move by days, fetch all blocks for the specific date, insert
        for (let date = lastDateForJob; date <= lastBlockDate; date.setDate(date.getDate() + 1)) {
          await txsPerDayDAL.create(
            {
              date: getDateString(date),
              value: await this.getTxsCountForDay(date),
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
   * Get the txs count for a given date
   * @param {Date} date
   */
  async getTxsCountForDay(date) {
    const blocks = await blocksDAL.findByDay({ dateString: getDateString(date) });
    return blocks.reduce(
      (count, cur) => (count = new Decimal(cur.txsCount).plus(count).toNumber()),
      0
    );
  }
}

module.exports = TxsPerDayCalc;

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
