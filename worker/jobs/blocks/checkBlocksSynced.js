'use strict';

const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const QueueError = require('../../lib/QueueError');

const TIME_TO_REPORT_UNSYNCED = 1800000; // 30 minutes

module.exports = async function checkBlocksSynced() {
  try {
    const latestBlockInDB = await blocksDAL.findLatest();
    if (latestBlockInDB) {
      const latestTime = new Date(Number(latestBlockInDB.timestamp));
      const now = new Date();
      if (now - latestTime > TIME_TO_REPORT_UNSYNCED) {
        throw new Error(
          `Blocks are not synced for more than ${TIME_TO_REPORT_UNSYNCED / 1000 / 60} minutes`
        );
      }
    }

    return true;
  } catch (error) {
    throw new QueueError(error);
  }
}