'use strict';

const test = require('blue-tape');
const td = require('testdouble');

let snapshotsTaker;
let blocksDAL;
let addressesDAL;
let voteIntervalsDAL;
let snapshotsDAL;

function before() {
  blocksDAL = td.replace('../../../server/components/api/blocks/blocksDAL', {
    findLatest: td.func('findLatest'),
  });
  addressesDAL = td.replace('../../../server/components/api/addresses/addressesDAL', {
    snapshotBalancesByBlock: td.func('snapshotBalancesByBlock'),
  });
  voteIntervalsDAL = td.replace('../../../server/components/api/repovote-intervals/repoVoteIntervalsDAL.js', {
    findAllWithoutSnapshot: td.func('findAllWithoutSnapshot'),
    setHasSnapshot: td.func('setHasSnapshot'),
  });
  snapshotsDAL = td.replace('../../../server/components/api/snapshots/snapshotsDAL', {
    bulkCreate: td.func('bulkCreate'),
    findAllHeights: td.func('findAllHeights'),
  });
  const db = td.replace('../../../server/db/sequelize/models/index.js', {
    sequelize: td.object(['transaction']),
    Sequelize: td.object(),
  });
  td.when(db.sequelize.transaction()).thenResolve({ commit() {} });

  const SnapshotsTaker = require('./SnapshotsTaker');
  snapshotsTaker = new SnapshotsTaker({ chain: 'test' });
}
function after() {
  td.reset();
}

test('SnapshotsTaker.doJob()', async function(t) {
  function stub({
    voteIntervals = [],
    addressAmounts = [],
    latestBlockNumber = 1,
    existingSnapshotHeights = [],
  } = {}) {
    td.when(blocksDAL.findLatest()).thenResolve({ blockNumber: latestBlockNumber });
    td.when(voteIntervalsDAL.findAllWithoutSnapshot(td.matchers.anything())).thenResolve(
      voteIntervals
    );
    td.when(addressesDAL.snapshotBalancesByBlock(td.matchers.anything())).thenResolve(
      addressAmounts
    );
    td.when(snapshotsDAL.findAllHeights()).thenResolve(existingSnapshotHeights);
  }

  await wrapTest('VoteIntervals: No intervals', async given => {
    before();
    stub();
    const result = await snapshotsTaker.doJob({});
    t.assert(Array.isArray(result.voteIntervals), `${given}: Should return an array`);
    t.equal(result.voteIntervals.length, 0, `${given}: Should return an empty array`);
    after();
  });

  await wrapTest('VoteIntervals: 1 interval', async given => {
    before();
    stub({
      voteIntervals: [
        {
          interval: 1,
          beginBlock: 1,
          endBlock: 1000,
        },
      ],
      addressAmounts: [
        {
          address: 'address1',
          amount: 1000,
        },
        {
          address: 'address2',
          amount: 2000,
        },
      ],
    });
    const result = await snapshotsTaker.doJob({});
    t.equals(result.voteIntervals.length, 1, `${given}: Should return an array with 1 element`);
    t.equals(result.voteIntervals[0].interval, 1, `${given}: Should return the interval`);
    t.equals(result.voteIntervals[0].snapshotCount, 2, `${given}: Should return the addresses`);
    after();
  });

  await wrapTest('CGP: interval 1, before snapshot', async given => {
    before();
    stub({
      latestBlockNumber: 40,
      addressAmounts: [
        {
          address: 'address1',
          amount: 1000,
        },
        {
          address: 'address2',
          amount: 2000,
        },
      ],
    });
    const result = await snapshotsTaker.doJob({});
    t.equals(result.cgp.length, 0, `${given}: Should return an empty array in cgp`);
    after();
  });

  await wrapTest('CGP: interval 1, at snapshot', async given => {
    before();
    stub({
      latestBlockNumber: 90,
      addressAmounts: [
        {
          address: 'address1',
          amount: 1000,
        },
        {
          address: 'address2',
          amount: 2000,
        },
      ],
    });
    const result = await snapshotsTaker.doJob({});
    t.equals(result.cgp.length, 1, `${given}: Should return an array with 1 element in cgp`);
    t.equals(result.cgp[0].interval, 1, `${given}: Should return interval 1`);
    t.equals(
      result.cgp[0].snapshotCount,
      2,
      `${given}: Should return the number of addresses in the snapshot`
    );
    after();
  });

  await wrapTest('CGP+Repo: both need snapshots', async given => {
    before();
    stub({
      latestBlockNumber: 92,
      voteIntervals: [
        {
          interval: 1,
          beginBlock: 1,
          endBlock: 1000,
        },
      ],
      addressAmounts: [
        {
          address: 'address1',
          amount: 1000,
        },
        {
          address: 'address2',
          amount: 2000,
        },
      ],
    });
    const result = await snapshotsTaker.doJob({});
    t.equals(result.cgp.length, 1, `${given}: Should return an array with 1 element in cgp`);
    t.equals(
      result.voteIntervals.length,
      1,
      `${given}: Should return an array with 1 element in voteIntervals`
    );
    t.equals(result.cgp[0].interval, 1, `${given}: Should return interval 1`);
    t.equals(result.voteIntervals[0].interval, 1, `${given}: Should return interval 0`);
    t.equals(
      result.cgp[0].snapshotCount,
      2,
      `${given}: Should return the number of addresses in the snapshot for cgp`
    );
    t.equals(
      result.voteIntervals[0].snapshotCount,
      2,
      `${given}: Should return the number of addresses in the snapshot for voteIntervals`
    );
    after();
  });
});

async function wrapTest(given, test) {
  await test(given);

  td.reset();
}
