'use strict';

const test = require('blue-tape');
const { Decimal } = require('decimal.js');
const calcTotalZpByHeight = require('./calcTotalZpByHeight');

test('calcTotalZpByHeight()', async function(t) {
  const getTest = ({ height, chain, expected, message = '' } = {}) =>
    wrapTest(`Given height=${height}, chain=${chain}`, async given => {
      const result = calcTotalZpByHeight({ height, chain });
      t.equal(
        result,
        expected,
        `${given}: should return ${expected}, returned ${result} ${message}`
      );
    });

  getTest({ height: 0, chain: 'test', expected: '0', message: '(typeof height = number)' });
  getTest({ height: '0', chain: 'test', expected: '0', message: '(typeof height = string)' });
  getTest({ height: 0, chain: 'main', expected: '0', message: '(typeof height = number)' });
  getTest({ height: '0', chain: 'main', expected: '0', message: '(typeof height = string)' });
  getTest({ height: 1, chain: 'test', expected: '1' });
  getTest({ height: 1, chain: 'main', expected: '2000000000000000' });
  getTest({ height: 2, chain: 'test', expected: '5000000001' });
  getTest({
    height: 2,
    chain: 'main',
    expected: new Decimal('5000000000').plus('2000000000000000').toString(),
  });
  getTest({ height: 3, chain: 'test', expected: '10000000001' });
  getTest({
    height: 3,
    chain: 'main',
    expected: new Decimal('10000000000').plus('2000000000000000').toString(),
  });
  getTest({
    height: 800001,
    chain: 'test',
    expected: new Decimal(800000)
      .times(50)
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800001,
    chain: 'main',
    expected: new Decimal(800000)
      .times(50)
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800002,
    chain: 'test',
    expected: new Decimal(800000)
      .times(50)
      .plus(25)
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800002,
    chain: 'main',
    expected: new Decimal(800000)
      .times(50)
      .plus(25)
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800003,
    chain: 'test',
    expected: new Decimal(800000)
      .times(50)
      .plus(25)
      .plus(25)
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800003,
    chain: 'main',
    expected: new Decimal(800000)
      .times(50)
      .plus(25)
      .plus(25)
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 1600000,
    chain: 'test',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(799999).times(25))
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 1600000,
    chain: 'test',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(799999).times(25))
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 1600001,
    chain: 'main',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(800000).times(25))
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 1600002,
    chain: 'test',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(800000).times(25))
      .plus(12.5)
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 1600002,
    chain: 'main',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(800000).times(25))
      .plus(12.5)
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 2400001,
    chain: 'test',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(800000).times(25))
      .plus(new Decimal(800000).times(12.5))
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 2400001,
    chain: 'main',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(800000).times(25))
      .plus(new Decimal(800000).times(12.5))
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 2400002,
    chain: 'test',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(800000).times(25))
      .plus(new Decimal(800000).times(12.5))
      .plus(6.25)
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 2400002,
    chain: 'main',
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(800000).times(25))
      .plus(new Decimal(800000).times(12.5))
      .plus(6.25)
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
});

async function wrapTest(given, test) {
  await test(given);
}
