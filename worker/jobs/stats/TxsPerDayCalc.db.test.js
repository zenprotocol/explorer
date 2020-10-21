'use strict';

const test = require('blue-tape');
const truncate = require('../../../test/lib/truncate');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const txsPerDayDAL = require('../../../server/components/api/txs-per-day/txsPerDayDAL');
const TxsPerDayCalc = require('./TxsPerDayCalc');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('TxsPerDayCalc.doJob() (DB)', async function (t) {
  await wrapTest('Given no blocks', async (given) => {
    const txsPerDayCalc = new TxsPerDayCalc();
    const result = await txsPerDayCalc.doJob();
    t.equal(result, 0, `${given}: should return 0`);
    t.equal(await txsPerDayDAL.count(), 0, `${given}: should not have any rows in TxsPerDay`);
  });
  await wrapTest('Given 1 block and no rows yet', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      txsCount: '50',
    });
    const txsPerDayCalc = new TxsPerDayCalc();
    const result = await txsPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day`);
    t.equal(await txsPerDayDAL.count(), 1, `${given}: should have 1 row in TxsPerDay`);
    const txsPerDay = await txsPerDayDAL.findAll();
    t.equal(txsPerDay[0].date, '2020-09-17', `${given}: should have the block date`);
    t.equal(txsPerDay[0].value, 50, `${given}: should have 50 txs in the row`);
  });
  await wrapTest('Given 1 row and no new blocks', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      txsCount: '50',
    });
    const txsPerDayCalc = new TxsPerDayCalc();
    await txsPerDayCalc.doJob();
    const result = await txsPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day (last)`);
    t.equal(await txsPerDayDAL.count(), 1, `${given}: should have 1 row in TxsPerDay`);
    const txsPerDay = await txsPerDayDAL.findAll();
    t.equal(txsPerDay[0].value, 50, `${given}: should have 50 txs in the row`);
  });
  await wrapTest('Given 1 row and new blocks', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      txsCount: '50',
    });
    const txsPerDayCalc = new TxsPerDayCalc();
    await txsPerDayCalc.doJob();

    await blocksDAL.create({
      blockNumber: 2,
      timestamp: '1600342758000', // same day, a bit later
      txsCount: '15',
    });

    const result = await txsPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day (last)`);
    t.equal(await txsPerDayDAL.count(), 1, `${given}: should have 1 row in TxsPerDay`);
    const txsPerDay = await txsPerDayDAL.findAll();
    t.equal(txsPerDay[0].value, 65, `${given}: should have 65 txs in the row`);
  });
  await wrapTest('Given several days', async (given) => {
    // add a block
    await Promise.all([
      blocksDAL.create({
        blockNumber: 1,
        timestamp: '1600339158000', // 2020-09-17
        txsCount: '50',
      }),
      await blocksDAL.create({
        blockNumber: 2,
        timestamp: '1600342758000', // 2020-09-17
        txsCount: '15',
      }),
      await blocksDAL.create({
        blockNumber: 3,
        timestamp: '1600396758000', // 2020-09-18
        txsCount: '11',
      }),
    ]);
    const txsPerDayCalc = new TxsPerDayCalc();
    const result = await txsPerDayCalc.doJob();
    t.equal(result, 2, `${given}: should return 2 for 2 days`);
    t.equal(await txsPerDayDAL.count(), 2, `${given}: should have 2 rows in TxsPerDay`);
    const txsPerDay = await txsPerDayDAL.findAll({order: [['date', 'ASC']]});
    t.equal(txsPerDay[0].date, '2020-09-17', `${given}: should have the first row with the first date`);
    t.equal(txsPerDay[0].value, 65, `${given}: should have correct value for the 1st date`);
    t.equal(txsPerDay[1].date, '2020-09-18', `${given}: should have the second row with the second date`);
    t.equal(txsPerDay[1].value, 11, `${given}: should have correct value for the 2nd date`);
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
