'use strict';

/**
 * For testing purposes, a normal (equal between db and node) hash will be the blockNumber, a different hash is 'abc'
 */

const test = require('blue-tape');
const td = require('testdouble');
const NetworkHelper = require('../../../lib/NetworkHelper');

const LATEST_DB_BLOCK = 10;

let blocksDAL;

test('ReorgProcessor.search()', async function(t) {
  await wrapTest('No reorg', async given => {
    const reorgProcessor = getReorgProcessor();
    const result = await reorgProcessor.search();
    t.equal(result, 0, `${given}: Should return 0`);
  });
});

// HELPERS
async function wrapTest(given, test) {
  blocksDAL = td.replace('../../../../server/components/api/blocks/blocksDAL', {
    findLatest: td.func('findLatest'),
    findByBlockNumber: td.func('findByBlockNumber'),
    bulkDelete: td.func('bulkDelete'),
  });

  for (let blockNumber = LATEST_DB_BLOCK; blockNumber > 0; blockNumber--) {
    td.when(blocksDAL.findByBlockNumber(blockNumber, td.matchers.anything())).thenResolve({
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
