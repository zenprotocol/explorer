'use strict';

const test = require('blue-tape');
const truncate = require('../../../test/lib/truncate');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const difficultyPerDayDAL = require('../../../server/components/api/difficulty-per-day/difficultyPerDayDAL');
const DifficultyPerDayCalc = require('./DifficultyPerDayCalc');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('DifficultyPerDayCalc.doJob() (DB)', async function (t) {
  await wrapTest('Given no blocks', async (given) => {
    const difficultyPerDayCalc = new DifficultyPerDayCalc();
    const result = await difficultyPerDayCalc.doJob();
    t.equal(result, 0, `${given}: should return 0`);
    t.equal(await difficultyPerDayDAL.count(), 0, `${given}: should not have any rows in DifficultyPerDay`);
  });
  await wrapTest('Given 1 block and no rows yet', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      difficulty: '1',
    });
    const difficultyPerDayCalc = new DifficultyPerDayCalc();
    const result = await difficultyPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day`);
    t.equal(await difficultyPerDayDAL.count(), 1, `${given}: should have 1 row in DifficultyPerDay`);
    const difficultyPerDay = await difficultyPerDayDAL.findAll();
    t.equal(difficultyPerDay[0].date, '2020-09-17', `${given}: should have the block date`);
    t.assert(difficultyPerDay[0].value > 0, `${given}: should have a difficulty`);
  });
  await wrapTest('Given 1 row and no new blocks', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      difficulty: '1',
    });
    const difficultyPerDayCalc = new DifficultyPerDayCalc();
    await difficultyPerDayCalc.doJob();
    const difficultyPerDay1 = await difficultyPerDayDAL.findAll();
    const result = await difficultyPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day (last)`);
    t.equal(await difficultyPerDayDAL.count(), 1, `${given}: should have 1 row in DifficultyPerDay`);
    const difficultyPerDay2 = await difficultyPerDayDAL.findAll();
    t.equal(difficultyPerDay2[0].value, difficultyPerDay1[0].value, `${given}: should have the same value as before`);
  });
  await wrapTest('Given 1 row and new blocks', async (given) => {
    // add a block
    await blocksDAL.create({
      blockNumber: 1,
      timestamp: '1600339158000', // 2020-09-17
      difficulty: '1',
    });
    const difficultyPerDayCalc = new DifficultyPerDayCalc();
    await difficultyPerDayCalc.doJob();
    const difficultyPerDay1 = await difficultyPerDayDAL.findAll();

    await blocksDAL.create({
      blockNumber: 2,
      timestamp: '1600342758000', // same day, a bit later
      difficulty: '2',
    });

    const result = await difficultyPerDayCalc.doJob();
    t.equal(result, 1, `${given}: should return 1 for 1 day (last)`);
    t.equal(await difficultyPerDayDAL.count(), 1, `${given}: should have 1 row in DifficultyPerDay`);
    const difficultyPerDay2 = await difficultyPerDayDAL.findAll();
    t.notEqual(difficultyPerDay2[0].value, difficultyPerDay1[0].value, `${given}: should not have the same value as before`);
  });
  await wrapTest('Given several days', async (given) => {
    // add a block
    await Promise.all([
      blocksDAL.create({
        blockNumber: 1,
        timestamp: '1600339158000', // 2020-09-17
        difficulty: '1',
      }),
      await blocksDAL.create({
        blockNumber: 2,
        timestamp: '1600342758000', // 2020-09-17
        difficulty: '2',
      }),
      await blocksDAL.create({
        blockNumber: 3,
        timestamp: '1600396758000', // 2020-09-18
        difficulty: '3',
      }),
    ]);
    const difficultyPerDayCalc = new DifficultyPerDayCalc();
    const result = await difficultyPerDayCalc.doJob();
    t.equal(result, 2, `${given}: should return 2 for 2 days`);
    t.equal(await difficultyPerDayDAL.count(), 2, `${given}: should have 2 rows in DifficultyPerDay`);
    const difficultyPerDay = await difficultyPerDayDAL.findAll({order: [['date', 'ASC']]});
    t.equal(difficultyPerDay[0].date, '2020-09-17', `${given}: should have the first row with the first date`);
    t.assert(difficultyPerDay[0].value > 0, `${given}: should have a difficulty for the first day`);
    t.equal(difficultyPerDay[1].date, '2020-09-18', `${given}: should have the second row with the second date`);
    t.assert(difficultyPerDay[1].value > 0, `${given}: 2nd have a difficulty for the 2nd day`);
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
