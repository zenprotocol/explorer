'use strict';

/**
 * For testing purposes, a normal (equal between db and node) hash will be the blockNumber, a different hash is 'abc'
 */

const test = require('blue-tape');
const td = require('testdouble');
const NetworkHelper = require('../../../lib/NetworkHelper');

const LATEST_DB_BLOCK = 10;

let blocksDAL;

test('ReorgProcessor.searchFork()', async function(t) {
  await wrapTest('Given no reorg', async given => {
    const reorgProcessor = getReorgProcessor();
    const result = await reorgProcessor.searchFork();
    t.equal(result, -1, `${given}: Should return -1`);
  });

  await wrapTest('Given that block 1 has a different hash', async given => {
    const blockWithDifferentHash = 1;
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [blockWithDifferentHash] });
    const result = await reorgProcessor.searchFork();
    t.equal(result, 0, `${given}: Should return 0`);
  });

  await wrapTest('Given one block with different hash', async given => {
    const blockWithDifferentHash = 8;
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [blockWithDifferentHash] });
    const result = await reorgProcessor.searchFork();
    t.equal(
      result,
      blockWithDifferentHash - 1,
      `${given}: Should return the block before the one with different hash`
    );
  });

  await wrapTest('Given several following different hashes', async given => {
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [5, 6, 7] });
    const result = await reorgProcessor.searchFork();
    t.equal(result, 4, `${given}: Should return the first block with equal hash`);
  });

  await wrapTest('Given several different hashes with a gap', async given => {
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [5, 7, 8] });
    const result = await reorgProcessor.searchFork();
    t.equal(result, 6, `${given}: Should return the first block with equal hash`);
  });
});

test('ReorgProcessor.doJob()', async function(t) {
  await wrapTest('Given no reorg', async given => {
    const reorgProcessor = getReorgProcessor();
    const result = await reorgProcessor.doJob();
    t.equal(result, 0, `${given}: Should return 0`);
  });

  await wrapTest('Given a reorg', async given => {
    const fork = 7;
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [fork + 1] });
    await reorgProcessor.doJob();
    try {
      td.verify(blocksDAL.bulkDelete(td.matchers.anything()));
      t.pass(`${given}: should call blocksDAL.bulkDelete`);
    }
    catch(error) {
      t.fail(`${given}: should call blocksDAL.bulkDelete`);
    }
  });
});

// HELPERS
async function wrapTest(given, test) {
  blocksDAL = td.replace('../../../../server/components/api/blocks/blocksDAL', {
    findLatest: td.func('findLatest'),
    findByBlockNumber: td.func('findByBlockNumber'),
    bulkDelete: td.func('bulkDelete'),
  });

  td.replace('../../../../server/db/sequelize/models/index.js', {
    sequelize: td.object(),
  });

  td.when(blocksDAL.findLatest()).thenResolve({ blockNumber: LATEST_DB_BLOCK });

  for (let blockNumber = LATEST_DB_BLOCK; blockNumber > 0; blockNumber--) {
    td.when(blocksDAL.findByBlockNumber(blockNumber)).thenResolve({
      hash: String(blockNumber),
    });
  }

  await test(given);

  td.reset();
}

function getReorgProcessor({ blocksWithDifferentHash = [] } = {}) {
  const FakeNetworkHelper = td.constructor(NetworkHelper);
  for (let blockNumber = LATEST_DB_BLOCK; blockNumber > 0; blockNumber--) {
    if (blocksWithDifferentHash.includes(blockNumber)) {
      td.when(FakeNetworkHelper.prototype.getBlockFromNode(blockNumber)).thenResolve({
        hash: 'abc',
      });
    } else {
      td.when(FakeNetworkHelper.prototype.getBlockFromNode(blockNumber)).thenResolve({
        hash: String(blockNumber),
      });
    }
  }
  const ReorgProcessor = require('../ReorgProcessor');
  return new ReorgProcessor(new FakeNetworkHelper());
}
