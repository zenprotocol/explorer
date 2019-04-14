'use strict';

const test = require('blue-tape');
const truncate = require('../../lib/truncate');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const voteIntervalsDAL = require('../../../server/components/api/voteIntervals/voteIntervalsDAL');
const snapshotsDAL = require('../../../server/components/api/snapshots/snapshotsDAL');
const SnapshotTaker = require('./SnapshotsTaker');
const BlocksAdder = require('../blocks/BlocksAdder');
const BlockchainParser = require('../../../server/lib/BlockchainParser');
const block1 = require('./data/block1.json');

const UNIQUE_ADDRESSES_IN_BLOCK_1 = 2203;

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('SnapshotTaker.doJob() (DB)', async function(t) {
  await wrapTest('Given no intervals', async given => {
    const snapshotTaker = new SnapshotTaker();
    const result = await snapshotTaker.doJob();
    t.equal(result.length, 0, `${given}: should not do anything`);
  });

  await wrapTest('Given an interval', async given => {
    const snapshotTaker = new SnapshotTaker();
    const blocksAdder = new BlocksAdder({}, new BlockchainParser());

    // insert an interval
    voteIntervalsDAL.create({
      interval: 1,
      beginHeight: 1,
      endHeight: 100,
    });
    // insert blocks
    await blocksAdder.addBlock({ job: {}, nodeBlock: JSON.parse(JSON.stringify(block1)) });

    const result = await snapshotTaker.doJob();
    t.equal(result.length, 1, `${given}: should add 1 interval`);
    t.equal(
      result[0].snapshotCount,
      UNIQUE_ADDRESSES_IN_BLOCK_1,
      `${given}: should add ${UNIQUE_ADDRESSES_IN_BLOCK_1} addresses from block 1`
    );

    const block1SnapshotCount = await snapshotsDAL.count({
      where: {
        height: 1,
      },
    });
    t.equal(
      block1SnapshotCount,
      UNIQUE_ADDRESSES_IN_BLOCK_1,
      `${given}: should insert ${UNIQUE_ADDRESSES_IN_BLOCK_1} rows to snapshots`
    );

    const theInterval = await voteIntervalsDAL.findOne({ where: { interval: 1 } });
    t.equal(
      theInterval.hasSnapshot,
      true,
      `${given}: should insert set hasSnapshot to true on the interval`
    );
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
