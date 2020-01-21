'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const db = require('../../../db/sequelize/models');
const cgpUtils = require('./cgpUtils');

test.onFinish(() => {
  db.sequelize.close();
});

test('cgpUtils.getIntervalBlocks()', async function(t) {
  async function getTest({ chain, interval, expected } = {}) {
    return wrapTest(`Given chain=${chain}, interval=${interval}`, async given => {
      const result = cgpUtils.getIntervalBlocks(chain, interval);
      t.deepEqual(result, expected, `${given}: should return  ${JSON.stringify(expected)}`);
    });
  }

  // test executions
  await getTest({ chain: 'test', interval: 1, expected: { snapshot: 90, tally: 100, coinbaseMaturity: 110 } });
  await getTest({ chain: 'main', interval: 1, expected: { snapshot: 9000, tally: 10000, coinbaseMaturity: 10100 } });
  await getTest({
    chain: 'main',
    interval: 1001,
    expected: { snapshot: 1000 * 10000 + 9000, tally: 1001 * 10000, coinbaseMaturity: 1001 * 10000 + 100 },
  });
});

test('cgpUtils.getIntervalByBlockNumber()', async function(t) {
  async function getTest({ chain, block, shouldReturnInterval } = {}) {
    return wrapTest(`Given chain=${chain}, current block = ${block}`, async given => {
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

test('cgpUtils.getRelevantIntervalBlocks()', async function(t) {
  async function getTest({ chain, interval, block, expected } = {}) {
    return wrapTest(
      `Given chain=${chain}, interval=${interval}, block=${block}`,
      async given => {
        const result = cgpUtils.getRelevantIntervalBlocks(chain, interval, block);
        t.deepEqual(result, expected, `${given}: should return  ${JSON.stringify(expected)}`);
      }
    );
  }

  // test executions
  await getTest({ chain: 'test', interval: 0, block: 80, expected: { interval: 1, snapshot: 90, tally: 100, coinbaseMaturity: 110  } });
  await getTest({ chain: 'test', interval: 1, expected: { interval: 1, snapshot: 90, tally: 100, coinbaseMaturity: 110  } });
  await getTest({ chain: 'test', interval: 2, expected: { interval: 2, snapshot: 190, tally: 200, coinbaseMaturity: 210  } });
  await getTest({ chain: 'test', block: 1, expected: { interval: 1, snapshot: 90, tally: 100, coinbaseMaturity: 110  } });
  await getTest({ chain: 'test', block: 99, expected: { interval: 1,snapshot: 90, tally: 100, coinbaseMaturity: 110  } });
  await getTest({ chain: 'test', block: 100, expected: { interval: 1,snapshot: 90, tally: 100, coinbaseMaturity: 110  } });
  await getTest({ chain: 'test', block: 101, expected: { interval: 1,snapshot: 90, tally: 100, coinbaseMaturity: 110  } });
  await getTest({ chain: 'test', block: 110, expected: { interval: 1,snapshot: 90, tally: 100, coinbaseMaturity: 110  } });
  await getTest({ chain: 'test', block: 111, expected: { interval: 2,snapshot: 190, tally: 200, coinbaseMaturity: 210  } });
  await getTest({ chain: 'main', interval: 1, expected: { interval: 1,snapshot: 9000, tally: 10000, coinbaseMaturity: 10100  } });
  await getTest({ chain: 'main', interval: 2, expected: { interval: 2,snapshot: 19000, tally: 20000, coinbaseMaturity: 20100  } });
  await getTest({ chain: 'main', block: 1, expected: { interval: 1, snapshot: 9000, tally: 10000, coinbaseMaturity: 10100  } });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}
