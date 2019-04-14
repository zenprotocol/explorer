'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const NetworkHelper = require('../../lib/NetworkHelper');

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
  voteIntervalsDAL = td.replace('../../../server/components/api/voteIntervals/voteIntervalsDAL', {
    findAllWithoutSnapshot: td.func('findAllWithoutSnapshot'),
    setHasSnapshot: td.func('setHasSnapshot'),
  });
  snapshotsDAL = td.replace('../../../server/components/api/snapshots/snapshotsDAL', {
    bulkCreate: td.func('bulkCreate'),
  });
  const db = td.replace('../../../server/db/sequelize/models/index.js', {
    sequelize: td.object(['transaction']),
  });
  td.when(db.sequelize.transaction()).thenResolve({ commit() {} });

  const FakeNetworkHelper = td.constructor(NetworkHelper);
  const SnapshotsTaker = require('./SnapshotsTaker');
  snapshotsTaker = new SnapshotsTaker(new FakeNetworkHelper());
}
function after() {
  td.reset();
}

test('SnapshotsTaker.doJob()', async function(t) {
  function stub({ voteIntervals = [], addressAmounts = [], latestBlockNumber = 1 } = {}) {
    td.when(blocksDAL.findLatest()).thenResolve({ blockNumber: latestBlockNumber });
    td.when(voteIntervalsDAL.findAllWithoutSnapshot(td.matchers.anything())).thenResolve(
      voteIntervals
    );
    td.when(addressesDAL.snapshotBalancesByBlock(td.matchers.anything())).thenResolve(
      addressAmounts
    );
  }

  await wrapTest('No intervals', async given => {
    before();
    stub();
    const result = await snapshotsTaker.doJob({});
    t.assert(Array.isArray(result), `${given}: Should return an array`);
    t.equal(result.length, 0, `${given}: Should return an empty array`);
    after();
  });

  await wrapTest('1 interval', async given => {
    before();
    stub({
      voteIntervals: [
        {
          interval: 1,
          beginHeight: 1,
          endHeight: 1000,
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
    t.equals(result.length, 1, `${given}: Should return an array with 1 element`);
    t.equals(result[0].voteInterval.beginHeight, 1, `${given}: Should return interval height`);
    t.equals(result[0].snapshotCount, 2, `${given}: Should return the addresses`);
    after();
  });
});

async function wrapTest(given, test) {
  await test(given);

  td.reset();
}
