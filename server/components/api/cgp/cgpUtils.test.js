'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const truncate = require('../../../../test/lib/truncate');
const db = require('../../../db/sequelize/models');

test.onFinish(() => {
  db.sequelize.close();
});

let cgpUtils;
let getChain;
let blocksBLL;

test('cgpUtils.getIntervalBlocks()', async function(t) {
  function before() {
    getChain = td.replace('../../../lib/getChain');
    cgpUtils = require('./cgpUtils');
  }

  async function getTest({ chain, interval, expectedResult } = {}) {
    return wrapTest(`Given chain=${chain}, interval=${interval}`, async given => {
      before();
      td.when(getChain()).thenResolve(chain);

      const result = await cgpUtils.getIntervalBlocks(interval);
      t.deepEqual(result, expectedResult, `${given}: should return  ${JSON.stringify(expectedResult)}`);
      after();
    });
  }

  // test executions
  await getTest({ chain: 'test', interval: 0, expectedResult: { snapshot: 90, tally: 100 } });
  await getTest({ chain: 'main', interval: 0, expectedResult: { snapshot: 9000, tally: 10000 } });
  await getTest({
    chain: 'main',
    interval: 1000,
    expectedResult: { snapshot: 1000 * 10000 + 9000, tally: 1000 * 10000 + 10000 },
  });
});

test('cgpUtils.getCurrentInterval()', async function(t) {
  function before() {
    getChain = td.replace('../../../lib/getChain');
    blocksBLL = td.replace('../blocks/blocksBLL');
    cgpUtils = require('./cgpUtils');
  }

  async function getTest({ chain, block, shouldReturnInterval } = {}) {
    return wrapTest(`Given chain=${chain}, current block = ${block}`, async given => {
      before();

      td.when(getChain()).thenResolve(chain);
      td.when(blocksBLL.getCurrentBlockNumber()).thenResolve(block);

      const result = await cgpUtils.getCurrentInterval();
      t.equal(
        result,
        shouldReturnInterval,
        `${given}: should return interval ${shouldReturnInterval}`
      );
      after();
    });
  }

  // test executions
  await getTest({ chain: 'test', block: 2, shouldReturnInterval: 0 });
  await getTest({ chain: 'test', block: 95, shouldReturnInterval: 0 });
  await getTest({ chain: 'test', block: 100, shouldReturnInterval: 0 });
  await getTest({ chain: 'test', block: 101, shouldReturnInterval: 1 });
  await getTest({ chain: 'test', block: 999, shouldReturnInterval: 9 });
  await getTest({ chain: 'main', block: 10, shouldReturnInterval: 0 });
  await getTest({ chain: 'main', block: 9000, shouldReturnInterval: 0 });
  await getTest({ chain: 'main', block: 10000, shouldReturnInterval: 0 });
  await getTest({ chain: 'main', block: 10001, shouldReturnInterval: 1 });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

function after() {
  td.reset();
}
