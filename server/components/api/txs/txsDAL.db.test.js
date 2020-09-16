'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const txsDAL = require('./txsDAL');
const blocksDAL = require('../blocks/blocksDAL');

test('txsDAL.findAllByBlock() (DB)', async function (t) {
  await wrapTest('Given empty db', async (given) => {
    const result = await txsDAL.findAllByBlock({
      hashOrBlockNumber: 1,
    });
    t.equal(result.length, 0, `${given}: should return an empty array`);
  });

  await wrapTest('Given some txs in db', async (given) => {
    await Promise.all([
      blocksDAL.create({
        blockNumber: 1,
        hash: 'hash1',
        parent: '0',
        timestamp: '1600173874146',
        txsCount: '2',
      }),
      blocksDAL.create({
        blockNumber: 2,
        hash: 'hash2',
        parent: '0',
        timestamp: '1600173874147',
        txsCount: '1',
      }),
    ]);
    await Promise.all([
      txsDAL.create({
        blockNumber: 1,
        index: 0,
        hash: 'tx1',
      }),
      txsDAL.create({
        blockNumber: 1,
        index: 1,
        hash: 'tx2',
      }),
      txsDAL.create({
        blockNumber: 2,
        index: 0,
        hash: 'tx3',
      }),
    ]);
    const result = await txsDAL.findAllByBlock({
      hashOrBlockNumber: 1,
    });
    t.equal(result.length, 2, `${given}: should return an array with the right txs`);
    t.assert(result.every(item => item.hash !== 'tx3'), `${given}: should not return txs from other blocks`);
  });
});

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
