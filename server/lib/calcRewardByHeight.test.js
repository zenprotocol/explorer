'use strict';

const test = require('blue-tape');
const calcRewardByHeight = require('./calcRewardByHeight');

test('calcRewardByHeight()', async function (t) {
  const getTest = ({ height, expected, message = '' } = {}) =>
    wrapTest(`Given height=${height}`, async (given) => {
      const result = calcRewardByHeight(height);
      t.equal(
        result,
        expected,
        `${given}: should return ${expected}, returned ${result} ${message}`
      );
    });

  getTest({ height: 0, expected: '0', message: '(typeof height = number)' });
  getTest({ height: '0', expected: '0', message: '(typeof height = string)' });
  getTest({ height: 1, expected: '0' });
  getTest({ height: 2, expected: '5000000000' });
  getTest({ height: 3, expected: '5000000000' });
  getTest({ height: 800001, expected: '5000000000' });
  getTest({ height: 800002, expected: '2500000000' });
  getTest({ height: 800003, expected: '2500000000' });
  getTest({ height: 1600000, expected: '2500000000' });
  getTest({ height: 1600001, expected: '2500000000' });
  getTest({ height: 1600002, expected: '1250000000' });
  getTest({ height: 2400001, expected: '1250000000' });
  getTest({ height: 2400002, expected: '625000000' });
});

async function wrapTest(given, test) {
  await test(given);
}
