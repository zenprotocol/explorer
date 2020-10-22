'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const db = require('../../../db/sequelize/models');
const cgpUtils = require('./cgpUtils');

test.onFinish(() => {
  db.sequelize.close();
});

test('cgpUtils.getIntervalBlocks()', async function (t) {
  async function getTest({ chain, interval, expected } = {}) {
    return wrapTest(`Given chain=${chain}, interval=${interval}`, async (given) => {
      const result = cgpUtils.getIntervalBlocks(chain, interval);
      t.deepEqual(result, expected, `${given}: should return  ${JSON.stringify(expected)}`);
    });
  }

  // test executions
  await getTest({
    chain: 'test',
    interval: 1,
    expected: { snapshot: 90, tally: 100, coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'main',
    interval: 1,
    expected: { snapshot: 9000, tally: 10000, coinbaseMaturity: 10100 },
  });
  await getTest({
    chain: 'main',
    interval: 1001,
    expected: {
      snapshot: 1000 * 10000 + 9000,
      tally: 1001 * 10000,
      coinbaseMaturity: 1001 * 10000 + 100,
    },
  });
});

test('cgpUtils.getIntervalByBlockNumber()', async function (t) {
  async function getTest({ chain, block, shouldReturnInterval } = {}) {
    return wrapTest(`Given chain=${chain}, current block = ${block}`, async (given) => {
      const result = cgpUtils.getIntervalByBlockNumber(chain, block);
      t.equal(
        result,
        shouldReturnInterval,
        `${given}: should return interval ${shouldReturnInterval}`
      );
    });
  }

  // test executions
  await getTest({ chain: 'test', block: 2, shouldReturnInterval: 1 });
  await getTest({ chain: 'test', block: 95, shouldReturnInterval: 1 });
  await getTest({ chain: 'test', block: 100, shouldReturnInterval: 1 });
  await getTest({ chain: 'test', block: 101, shouldReturnInterval: 2 });
  await getTest({ chain: 'test', block: 999, shouldReturnInterval: 10 });
  await getTest({ chain: 'main', block: 10, shouldReturnInterval: 1 });
  await getTest({ chain: 'main', block: 9000, shouldReturnInterval: 1 });
  await getTest({ chain: 'main', block: 10000, shouldReturnInterval: 1 });
  await getTest({ chain: 'main', block: 10001, shouldReturnInterval: 2 });
});

test('cgpUtils.getRelevantIntervalBlocks()', async function (t) {
  async function getTest({ chain, interval, phase, block, expected } = {}) {
    return wrapTest(
      `Given chain=${chain}, interval=${interval}, phase=${phase}, block=${block}`,
      async (given) => {
        const result = cgpUtils.getRelevantIntervalBlocks({
          chain,
          currentBlock: block,
          interval,
          phase,
        });
        t.deepEqual(result, expected, `${given}: should return  ${JSON.stringify(expected)}`);
      }
    );
  }

  await getTest({
    chain: 'test',
    interval: 0,
    block: 80,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Nomination', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    interval: 1,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Nomination', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    interval: 1,
    phase: 'Vote',
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Vote', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    interval: 1,
    block: 196, // if both interval and block are supplied should ignore block
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Nomination', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    interval: 2,
    expected: {
      interval: 2,
      snapshot: 190,
      tally: 200,
      phase: 'Nomination',
      coinbaseMaturity: 210,
    },
  });
  await getTest({
    chain: 'test',
    interval: 2,
    phase: 'Vote',
    expected: { interval: 2, snapshot: 190, tally: 200, phase: 'Vote', coinbaseMaturity: 210 },
  });
  await getTest({
    chain: 'test',
    block: 1,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Nomination', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    block: 94,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Nomination', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    block: 95,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Vote', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    block: 99,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Vote', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    block: 100,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Vote', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    block: 101,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Vote', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    block: 110,
    expected: { interval: 1, snapshot: 90, tally: 100, phase: 'Vote', coinbaseMaturity: 110 },
  });
  await getTest({
    chain: 'test',
    block: 111,
    expected: {
      interval: 2,
      snapshot: 190,
      tally: 200,
      phase: 'Nomination',
      coinbaseMaturity: 210,
    },
  });
  await getTest({
    chain: 'main',
    interval: 1,
    expected: {
      interval: 1,
      snapshot: 9000,
      tally: 10000,
      phase: 'Nomination',
      coinbaseMaturity: 10100,
    },
  });
  await getTest({
    chain: 'main',
    interval: 2,
    expected: {
      interval: 2,
      snapshot: 19000,
      tally: 20000,
      phase: 'Nomination',
      coinbaseMaturity: 20100,
    },
  });
  await getTest({
    chain: 'main',
    block: 1,
    expected: {
      interval: 1,
      snapshot: 9000,
      tally: 10000,
      phase: 'Nomination',
      coinbaseMaturity: 10100,
    },
  });
});

test('cgpUtils.getPhaseBlocks()', async function (t) {
  async function getTest({ chain, interval, type, expected } = {}) {
    return wrapTest(`Given chain=${chain}, interval=${interval}, type=${type}`, async (given) => {
      const result = cgpUtils.getPhaseBlocks({ chain, interval, type });
      t.deepEqual(result, expected, `${given}: should return ${JSON.stringify(expected)}`);
    });
  }

  await getTest({
    chain: 'test',
    interval: 1,
    type: 'Nomination',
    expected: { beginBlock: 90, endBlock: 95 },
  });
  await getTest({
    chain: 'test',
    interval: 1,
    type: 'allocation', // try with lower case
    expected: { beginBlock: 95, endBlock: 100 },
  });
  await getTest({
    chain: 'test',
    interval: 1,
    type: 'Payout', // try with lower case
    expected: { beginBlock: 95, endBlock: 100 },
  });

  await getTest({
    chain: 'main',
    interval: 1,
    type: 'nomination',
    expected: { beginBlock: 9000, endBlock: 9500 },
  });
  await getTest({
    chain: 'main',
    interval: 1,
    type: 'Allocation',
    expected: { beginBlock: 9500, endBlock: 10000 },
  });
  await getTest({
    chain: 'main',
    interval: 1,
    type: 'payout',
    expected: { beginBlock: 9500, endBlock: 10000 },
  });

  await getTest({
    chain: 'test',
    interval: 8,
    type: 'Nomination',
    expected: { beginBlock: 790, endBlock: 795 },
  });
  await getTest({
    chain: 'test',
    interval: 8,
    type: 'allocation', // try with lower case
    expected: { beginBlock: 795, endBlock: 800 },
  });
  await getTest({
    chain: 'test',
    interval: 8,
    type: 'Payout', // try with lower case
    expected: { beginBlock: 795, endBlock: 800 },
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
