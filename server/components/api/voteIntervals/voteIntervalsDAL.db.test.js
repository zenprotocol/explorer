'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const blocksDAL = require('../blocks/blocksDAL');
const voteIntervalsDAL = require('./voteIntervalsDAL');

test('voteIntervalsDAL.findAllRecent() (DB)', async function(t) {
  await wrapTest('Given no intervals', async given => {
    const intervals = await voteIntervalsDAL.findAllRecent(100);
    t.equal(intervals.length, 0, `${given}: should return an empty array`);
  });

  await wrapTest('Given 1 current interval phase', async given => {
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    });
    const intervals = await voteIntervalsDAL.findAllRecent(100);
    t.equal(intervals.length, 1, `${given}: should return the interval`);
  });

  await wrapTest('Given 1 past interval phase', async given => {
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    });
    const intervals = await voteIntervalsDAL.findAllRecent(300);
    t.equal(intervals.length, 1, `${given}: should return the interval`);
  });

  await wrapTest('Given 1 future interval phase', async given => {
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    });
    const intervals = await voteIntervalsDAL.findAllRecent(50);
    t.equal(intervals.length, 1, `${given}: should return the interval`);
  });

  await wrapTest(
    'Given 2 intervals with no gap and current block is at the middle',
    async given => {
      await Promise.all([
        voteIntervalsDAL.create({
          interval: 1,
          phase: 'Contestant',
          beginHeight: 100,
          endHeight: 200,
        }),
        voteIntervalsDAL.create({
          interval: 1,
          phase: 'Candidate',
          beginHeight: 200,
          endHeight: 300,
        }),
      ]);
      const intervals = await voteIntervalsDAL.findAllRecent(200);
      t.equal(intervals.length, 2, `${given}: should return the 2 intervals`);
      t.deepEqual(
        intervals.map(interval => interval.phase),
        ['Candidate', 'Contestant'],
        `${given}: should have both intervals`
      );
    }
  );

  const aFewIntervals = [
    {
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    },
    {
      interval: 1,
      phase: 'Candidate',
      beginHeight: 300,
      endHeight: 400,
    },
    {
      interval: 2,
      phase: 'Contestant',
      beginHeight: 500,
      endHeight: 600,
    },
    {
      interval: 2,
      phase: 'Candidate',
      beginHeight: 700,
      endHeight: 800,
    },
    {
      interval: 3,
      phase: 'Contestant',
      beginHeight: 900,
      endHeight: 1000,
    },
    {
      interval: 3,
      phase: 'Candidate',
      beginHeight: 1100,
      endHeight: 1200,
    },
  ];

  await wrapTest('Given a few intervals in the future, current is contestant', async given => {
    await voteIntervalsDAL.bulkCreate(aFewIntervals);
    const intervals = await voteIntervalsDAL.findAllRecent(150);
    t.equal(
      intervals.length,
      4,
      `${given}: should return up to next interval including both phases`
    );
    const first = intervals[0];
    const last = intervals[intervals.length - 1];
    t.assert(
      first.interval === 2 && first.phase === 'Candidate',
      `${given}: first interval should be next interval candidate phase`
    );
    t.assert(
      last.interval === 1 && last.phase === 'Contestant',
      `${given}: last interval should be 1st interval contestants phase`
    );
  });

  await wrapTest('Given a few intervals in the future, current is candidate', async given => {
    await voteIntervalsDAL.bulkCreate(aFewIntervals);
    const intervals = await voteIntervalsDAL.findAllRecent(350);
    t.equal(
      intervals.length,
      4,
      `${given}: should return up to next interval including both phases`
    );
    const first = intervals[0];
    t.assert(
      first.interval === 2 && first.phase === 'Candidate',
      `${given}: should return up to next interval including both phases`
    );
  });

  await wrapTest('Given a few intervals in the future, current is 2 contestant', async given => {
    await voteIntervalsDAL.bulkCreate(aFewIntervals);
    const intervals = await voteIntervalsDAL.findAllRecent(550);
    t.equal(
      intervals.length,
      6,
      `${given}: should return up to next interval including both phases`
    );
    const first = intervals[0];
    t.assert(
      first.interval === 3 && first.phase === 'Candidate',
      `${given}: should return up to next interval including both phases`
    );
  });
});

test('voteIntervalsDAL.findCurrentOrNext() (DB)', async function(t) {
  await wrapTest('Given no intervals', async given => {
    const interval = await voteIntervalsDAL.findCurrentOrNext(1);
    t.equal(interval, null, `${given}: should return null`);
  });

  await wrapTest('Given only past intervals', async given => {
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    });
    // tally is already after the interval
    const interval = await voteIntervalsDAL.findCurrentOrNext(200);
    t.equal(interval, null, `${given}: should return null`);
  });

  await wrapTest('Given an on-going interval', async given => {
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    });
    const interval = await voteIntervalsDAL.findCurrentOrNext(100);
    t.equal(interval.interval, 1, `${given}: should return the interval`);
  });

  await wrapTest('Given a future interval', async given => {
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    });
    const interval = await voteIntervalsDAL.findCurrentOrNext(99);
    t.equal(interval.interval, 1, `${given}: should return the interval`);
  });

  await wrapTest('Given both an on-going and a future interval', async given => {
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    });
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Candidate',
      beginHeight: 300,
      endHeight: 400,
    });
    const interval = await voteIntervalsDAL.findCurrentOrNext(150);
    t.assert(
      interval.interval === 1 && interval.phase === 'Contestant',
      `${given}: should return the on-going interval`
    );
  });

  await wrapTest('Given current block is between intervals', async given => {
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Contestant',
      beginHeight: 100,
      endHeight: 200,
    });
    await voteIntervalsDAL.create({
      interval: 1,
      phase: 'Candidate',
      beginHeight: 300,
      endHeight: 400,
    });
    const interval = await voteIntervalsDAL.findCurrentOrNext(250);
    t.assert(
      interval.interval === 1 && interval.phase === 'Candidate',
      `${given}: should return the next interval`
    );
  });
});

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
