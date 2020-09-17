'use strict';

const test = require('blue-tape');
const truncate = require('../../../test/lib/truncate');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const zpSupplyPerDayDAL = require('../../../server/components/api/zp-supply-per-day/zpSupplyPerDayDAL');
const ZpSupplyPerDayCalc = require('./ZpSupplyPerDayCalc');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('ZpSupplyPerDayCalc.doJob() (DB)', async function (t) {
  await wrapTest('Given no blocks', async (given) => {
    const zpSupplyPerDayCalc = new ZpSupplyPerDayCalc();
    const result = await zpSupplyPerDayCalc.doJob();
    t.equal(result, 0, `${given}: should return 0`);
    t.equal(await zpSupplyPerDayDAL.count(), 0, `${given}: should not have any rows in ZpSupplyPerDay`);
  });
  await wrapTest('Given 1 block and no rows yet', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      reward: '1',
    });
    const zpSupplyPerDayCalc = new ZpSupplyPerDayCalc();
    const result = await zpSupplyPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day`);
    t.equal(await zpSupplyPerDayDAL.count(), 1, `${given}: should have 1 row in ZpSupplyPerDay`);
    const zpSupplyPerDay = await zpSupplyPerDayDAL.findAll();
    t.equal(zpSupplyPerDay[0].date, '2020-09-17', `${given}: should have the block date`);
    t.equal(zpSupplyPerDay[0].value, 0.00000001, `${given}: should have the reward in the row`);
  });
  await wrapTest('Given 1 row and no new blocks', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      reward: '5000000000',
    });
    const zpSupplyPerDayCalc = new ZpSupplyPerDayCalc();
    await zpSupplyPerDayCalc.doJob();
    const result = await zpSupplyPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day (last)`);
    t.equal(await zpSupplyPerDayDAL.count(), 1, `${given}: should have 1 row in ZpSupplyPerDay`);
    const zpSupplyPerDay = await zpSupplyPerDayDAL.findAll();
    t.equal(zpSupplyPerDay[0].value, 50, `${given}: should have 50 zp in the row`);
  });
  await wrapTest('Given 1 row and new blocks', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      reward: '5000000000',
    });
    const zpSupplyPerDayCalc = new ZpSupplyPerDayCalc();
    await zpSupplyPerDayCalc.doJob();

    await blocksDAL.create({
      blockNumber: 2,
      timestamp: '1600342758000', // same day, a bit later
      reward: '1500000000',
    });

    const result = await zpSupplyPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day (last)`);
    t.equal(await zpSupplyPerDayDAL.count(), 1, `${given}: should have 1 row in ZpSupplyPerDay`);
    const zpSupplyPerDay = await zpSupplyPerDayDAL.findAll();
    t.equal(zpSupplyPerDay[0].value, 65, `${given}: should have value of 65 in the row`);
  });
  await wrapTest('Given several days', async (given) => {
    // add a block
    await Promise.all([
      blocksDAL.create({
        blockNumber: 1,
        timestamp: '1600339158000', // 2020-09-17
        reward: '5000000000',
      }),
      await blocksDAL.create({
        blockNumber: 2,
        timestamp: '1600342758000', // 2020-09-17
        reward: '1500000000',
      }),
      await blocksDAL.create({
        blockNumber: 3,
        timestamp: '1600396758000', // 2020-09-18
        reward: '1100000000',
      }),
    ]);
    const zpSupplyPerDayCalc = new ZpSupplyPerDayCalc();
    const result = await zpSupplyPerDayCalc.doJob();
    t.equal(result, 2, `${given}: should return 2 for 2 days`);
    t.equal(await zpSupplyPerDayDAL.count(), 2, `${given}: should have 2 rows in ZpSupplyPerDay`);
    const zpSupplyPerDay = await zpSupplyPerDayDAL.findAll({order: [['date', 'ASC']]});
    t.equal(zpSupplyPerDay[0].date, '2020-09-17', `${given}: should have the first row with the first date`);
    t.equal(zpSupplyPerDay[0].value, 65, `${given}: should have correct value for the 1st date`);
    t.equal(zpSupplyPerDay[1].date, '2020-09-18', `${given}: should have the second row with the second date`);
    t.equal(zpSupplyPerDay[1].value, 76, `${given}: 2nd day should be the sum of the 1st and 2nd`);
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
