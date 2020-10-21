'use strict';

/**
 * For testing purposes, a normal (equal between db and node) hash will be the blockNumber, a different hash is 'abc'
 */

const test = require('blue-tape');
const td = require('testdouble');
const NetworkHelper = require('../../../lib/NetworkHelper');

const LATEST_DB_BLOCK = 10;

let blocksDAL;

test('ReorgProcessor.searchForks()', async function(t) {
  await wrapTest('', async given => {
    const reorgProcessor = getReorgProcessor();
    const result = await reorgProcessor.searchForks();
    t.assert(Array.isArray(result), 'Should return an array');
  });

  await wrapTest('Given no reorg', async given => {
    const reorgProcessor = getReorgProcessor();
    const result = await reorgProcessor.searchForks();
    t.equal(result.length, 0, `${given}: Should return an empty array`);
  });

  await wrapTest('Given that block 1 has a different hash', async given => {
    const blockWithDifferentHash = 1;
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [blockWithDifferentHash] });
    const result = await reorgProcessor.searchForks();
    t.deepEqual(result, [0], `${given}: Should return [0]`);
  });

  await wrapTest('Given one block with different hash', async given => {
    const blockWithDifferentHash = 8;
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [blockWithDifferentHash] });
    const result = await reorgProcessor.searchForks();
    t.deepEqual(
      result,
      [blockWithDifferentHash - 1],
      `${given}: Should return the block before the one with different hash`
    );
  });

  await wrapTest('Given several following different hashes', async given => {
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [5, 6, 7] });
    const result = await reorgProcessor.searchForks();
    t.deepEqual(result, [4], `${given}: Should return the first block with equal hash`);
  });

  await wrapTest('Given several different hashes with a gap', async given => {
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [5, 7, 8] });
    const result = await reorgProcessor.searchForks();
    t.deepEqual(result, [6], `${given}: Should return the first block with equal hash`);
  });

  await wrapTest('Given several different hashes with a gap and searchAll=true', async given => {
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [5, 7, 8] });
    const result = await reorgProcessor.searchForks(true);
    t.deepEqual(result, [6, 4], `${given}: Should return all of the forks`);
  });
});

test('ReorgProcessor.doJob()', async function(t) {
  await wrapTest('', async given => {
    const reorgProcessor = getReorgProcessor();
    const result = await reorgProcessor.doJob();
    t.assert(typeof result === 'object', 'Should return an object');
    t.assert(Object.keys(result).includes('forks'), 'Result should have a "forks" key');
    t.assert(Object.keys(result).includes('deleted'), 'Result should have a "deleted" key');
    t.assert(Array.isArray(result.forks), '"forks" key should be an array');
    t.assert(typeof result.deleted === 'number', '"deleted" key should be a number');
  });

  await wrapTest('Given no reorg', async given => {
    const reorgProcessor = getReorgProcessor();
    const result = await reorgProcessor.doJob();
    t.equal(result.deleted, 0, `${given}: "deleted" key should be 0`);
  });

  await wrapTest('Given a prevent delete parameter is sent', async given => {
    const fork = 7;
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [fork + 1] });
    await reorgProcessor.doJob({ data: { delete: false } });
    try {
      td.verify(blocksDAL.bulkDelete(td.matchers.anything()));
      t.fail(`${given}: should not call blocksDAL.bulkDelete`);
    } catch (error) {
      t.pass(`${given}: should not call blocksDAL.bulkDelete`);
    }
  });

  await wrapTest('Given job params all=true & delete=false', async given => {
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [8, 6, 4] });
    const result = await reorgProcessor.doJob({ data: { all: true, delete: false } });
    t.equal(result.deleted, 0, `${given}: should not delete any blocks`);
    t.deepEqual(result.forks, [7, 5, 3], `${given}: forks should contain all of the forks`);
  });

  await wrapTest('Given job params all=true & delete=true', async given => {
    const reorgProcessor = getReorgProcessor({ blocksWithDifferentHash: [8, 6, 4] });
    await reorgProcessor.doJob({ data: { all: true, delete: true } });
    const message = `${given}: should call blocksDAL.bulkDelete with blockNumber > 3`;
    try {
      td.verify(
        blocksDAL.bulkDelete(td.matchers.contains({ where: { blockNumber: { undefined: 3 } } }))
      );
      t.pass(message);
    } catch (error) {
      t.fail(message);
    }
  });
});

// HELPERS
async function wrapTest(given, test) {
  blocksDAL = td.replace('../../../../server/components/api/blocks/blocksDAL', {
    findLatest: td.func('findLatest'),
    findById: td.func('findById'),
    findOne: td.func('findOne'),
    bulkDelete: td.func('bulkDelete'),
  });
  const txsDAL = td.replace('../../../../server/components/api/txs/txsDAL', {
    findAll: td.func('findAll'),
  });
  td.replace('../../../../server/components/api/contracts/contractsDAL', {
    findByAddress: td.func('findByAddress'),
    findById: td.func('findById'),
  });
  td.replace('../../../../server/components/api/addresses/addressesDAL', {
    findByAddressAsset: td.func('findByAddressAsset'),
    count: td.func('count'),
  });
  td.replace('../../../../server/components/api/assets/assetsDAL', {
    findById: td.func('findById'),
    count: td.func('count'),
  });
  td.replace('../../../../server/components/api/inputs/inputsDAL', {
    findAll: td.func('findAll'),
  });
  td.replace('../../../../server/components/api/outputs/outputsDAL', {
    findAll: td.func('findAll'),
  });

  const db = td.replace('../../../../server/db/sequelize/models/index.js', {
    sequelize: td.object(['transaction']),
    Sequelize: td.object(),
  });
  td.when(db.sequelize.transaction()).thenResolve({ commit() {}, rollback() {} });

  td.when(blocksDAL.findLatest()).thenResolve({ blockNumber: LATEST_DB_BLOCK });
  td.when(txsDAL.findAll(td.matchers.anything())).thenResolve([]);

  for (let blockNumber = LATEST_DB_BLOCK; blockNumber > 0; blockNumber--) {
    td.when(blocksDAL.findById(blockNumber)).thenResolve({
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
  return new ReorgProcessor(new FakeNetworkHelper(), '20000000');
}
