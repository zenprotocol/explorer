'use strict';

const test = require('blue-tape');
const faker = require('faker');
const truncate = require('../../../test/lib/truncate');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const txsDAL = require('../../../server/components/api/txs/txsDAL');
const outputsDAL = require('../../../server/components/api/outputs/outputsDAL');
const repoVoteIntervalsDAL = require('../../../server/components/api/repovote-intervals/repoVoteIntervalsDAL');
const snapshotsDAL = require('../../../server/components/api/snapshots/snapshotsDAL');
const SnapshotTaker = require('./SnapshotsTaker');
const createDemoBlocksFromTo = require('../../../test/lib/createDemoBlocksFromTo');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('SnapshotTaker.doJob() (DB)', async function (t) {
  await wrapTest('VoteIntervals: Given no intervals', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });
    const result = await snapshotTaker.doJob();
    t.equal(result.voteIntervals.length, 0, `${given}: should not do anything`);
  });

  await wrapTest('VoteIntervals: Given an interval', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });

    await createDemoData({
      currentBlock: 10,
      addressAmounts: {
        tzn1q123: 50 * 100000000,
        tzn1q124: 100 * 100000000,
      },
      voteIntervals: [
        {
          interval: 1,
          beginBlock: 1,
          endBlock: 100,
        },
      ],
    });

    const result = await snapshotTaker.doJob();
    t.equal(result.voteIntervals.length, 1, `${given}: should add 1 interval`);
    t.equal(
      result.voteIntervals[0].snapshotCount,
      2,
      `${given}: should add 2 addresses from block 1`
    );

    const block1SnapshotCount = await snapshotsDAL.count({
      where: {
        blockNumber: 1,
      },
    });
    t.equal(block1SnapshotCount, 2, `${given}: should insert 2 rows to snapshots`);

    const theInterval = await repoVoteIntervalsDAL.findOne({ where: { interval: 1 } });
    t.equal(
      theInterval.hasSnapshot,
      true,
      `${given}: should insert set hasSnapshot to true on the interval`
    );
  });

  // CGP ---
  await wrapTest('CGP: No blocks', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });
    const result = await snapshotTaker.doJob();
    t.equal(result.cgp.length, 0, `${given}: should not take a snapshot`);
  });

  await wrapTest('CGP: before 1st snapshot block', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });
    await createDemoData({
      currentBlock: 89,
      addressAmounts: {
        tzn1q123: 50 * 100000000,
        tzn1q124: 100 * 100000000,
      },
    });
    const result = await snapshotTaker.doJob();
    t.equal(result.cgp.length, 0, `${given}: should not take a snapshot`);
  });

  await wrapTest('CGP: at 1st snapshot block', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });
    await createDemoData({
      currentBlock: 90,
      addressAmounts: {
        tzn1q123: 50 * 100000000,
        tzn1q124: 100 * 100000000,
      },
    });
    const result = await snapshotTaker.doJob();
    t.equal(result.voteIntervals.length, 0, `${given}: should not take a VoteInterval snapshot`);
    t.equal(result.cgp.length, 1, `${given}: should take a CGP snapshot`);
    t.equal(result.cgp[0].snapshotCount, 2, `${given}: should have 2 rows in the snapshot`);
  });

  await wrapTest('CGP: snapshot already exists', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });
    await createDemoData({
      currentBlock: 91,
      addressAmounts: {
        tzn1q123: 50 * 100000000,
        tzn1q124: 100 * 100000000,
      },
    });

    // run first to have a snapshot already
    await snapshotTaker.doJob();

    // 2nd run
    const result = await snapshotTaker.doJob();
    t.equal(result.cgp.length, 0, `${given}: should not take a 2nd CGP snapshot`);
  });

  await wrapTest('CGP: some snapshots already exist', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });

    await createDemoData({
      currentBlock: 300,
      addressAmounts: {
        tzn1q123: 50 * 100000000,
        tzn1q124: 100 * 100000000,
      },
    });

    // add a snapshot for the 2nd interval but leave the 1st and 3rd empty
    await snapshotsDAL.bulkCreate([
      { blockNumber: 190, address: 'tzn1q123', amount: 50 * 100000000 },
      { blockNumber: 190, address: 'tzn1q124', amount: 100 * 100000000 },
    ]);

    const result = await snapshotTaker.doJob();
    t.equal(result.cgp.length, 2, `${given}: should take only 2 CGP snapshots`);
    t.equal(
      await snapshotsDAL.count(),
      6, // 2 addresses in each interval
      `${given}: should have 2 rows per interval in the Snapshot table`
    );
  });

  await wrapTest('CGP+VoteIntervals: different snapshot block', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });
    await createDemoData({
      currentBlock: 90,
      addressAmounts: {
        tzn1q123: 50 * 100000000,
        tzn1q124: 100 * 100000000,
      },
      voteIntervals: [
        {
          interval: 1,
          beginBlock: 80,
          endBlock: 1000,
        },
      ],
    });
    const result = await snapshotTaker.doJob();
    t.equal(result.voteIntervals.length, 1, `${given}: should take a VoteInterval snapshot`);
    t.equal(result.cgp.length, 1, `${given}: should take a CGP snapshot`);
    t.equal(
      result.voteIntervals[0].snapshotCount,
      2,
      `${given}: should have 2 rows in the VoteIntervals snapshot`
    );
    t.equal(result.cgp[0].snapshotCount, 2, `${given}: should have 2 rows in the CGP snapshot`);
  });

  await wrapTest('CGP+VoteIntervals: same snapshot block', async (given) => {
    const snapshotTaker = new SnapshotTaker({ chain: 'test' });
    await createDemoData({
      currentBlock: 90,
      addressAmounts: {
        tzn1q123: 50 * 100000000,
        tzn1q124: 100 * 100000000,
      },
      voteIntervals: [
        {
          interval: 1,
          beginBlock: 90,
          endBlock: 1000,
        },
      ],
    });

    await snapshotTaker.doJob();

    t.equal(
      await snapshotsDAL.count({
        where: {
          blockNumber: 90,
        },
      }),
      2,
      `${given}: should have 2 rows in the CGP snapshot`
    );
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

/**
 * Creates a range of blocks, some addresses with amount, an interval and take a snapshot
 */
async function createDemoData({ currentBlock, addressAmounts = {}, voteIntervals = [] } = {}) {
  // create a range of blocks
  await createDemoBlocksFromTo(1, currentBlock);
  // add amount to some addresses all in block 1
  for (let i = 0; i < Object.keys(addressAmounts).length; i++) {
    const address = Object.keys(addressAmounts)[i];
    const amount = addressAmounts[address];
    const tx = await txsDAL.create({
      blockNumber: 1,
      index: i,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount,
      index: 0,
    });
  }
  if (voteIntervals.length) {
    await Promise.all(
      voteIntervals.map((voteInterval) => {
        return repoVoteIntervalsDAL.create({
          interval: voteInterval.interval,
          beginBlock: voteInterval.beginBlock,
          endBlock: voteInterval.endBlock,
        });
      })
    );
  }
}
