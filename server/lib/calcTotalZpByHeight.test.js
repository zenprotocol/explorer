'use strict';

const test = require('blue-tape');
const { Decimal } = require('decimal.js');
const calcTotalZpByHeight = require('./calcTotalZpByHeight');

const GENESIS = {
  main: '20000000',
  test: '0.00000001',
};

test('calcTotalZpByHeight()', async function(t) {
  const getTest = ({ height, genesis, expected, message = '' } = {}) =>
    wrapTest(`Given height=${height}, genesis=${genesis}`, async given => {
      const result = calcTotalZpByHeight({ height, genesis });
      t.equal(
        result,
        expected,
        `${given}: should return ${expected}, returned ${result} ${message}`
      );
    });

  getTest({ height: 0, genesis: GENESIS.test, expected: '0', message: '(typeof height = number)' });
  getTest({ height: '0', genesis: GENESIS.test, expected: '0', message: '(typeof height = string)' });
  getTest({ height: 0, genesis: GENESIS.main, expected: '0', message: '(typeof height = number)' });
  getTest({ height: '0', genesis: GENESIS.main, expected: '0', message: '(typeof height = string)' });
  getTest({ height: 1, genesis: GENESIS.test, expected: '1' });
  getTest({ height: 1, genesis: GENESIS.main, expected: '2000000000000000' });
  getTest({ height: 2, genesis: GENESIS.test, expected: '5000000001' });
  getTest({
    height: 2,
    genesis: GENESIS.main,
    expected: new Decimal('5000000000').plus('2000000000000000').toString(),
  });
  getTest({ height: 3, genesis: GENESIS.test, expected: '10000000001' });
  getTest({
    height: 3,
    genesis: GENESIS.main,
    expected: new Decimal('10000000000').plus('2000000000000000').toString(),
  });
  getTest({
    height: 800001,
    genesis: GENESIS.test,
    expected: new Decimal(800000)
      .times(50)
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800001,
    genesis: GENESIS.main,
    expected: new Decimal(800000)
      .times(50)
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800002,
    genesis: GENESIS.test,
    expected: new Decimal(800000)
      .times(50)
      .plus(25)
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800002,
    genesis: GENESIS.main,
    expected: new Decimal(800000)
      .times(50)
      .plus(25)
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 800003,
    genesis: GENESIS.test,
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
    genesis: GENESIS.main,
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
    genesis: GENESIS.test,
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(799999).times(25))
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 1600000,
    genesis: GENESIS.test,
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(799999).times(25))
      .plus(0.00000001)
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 1600001,
    genesis: GENESIS.main,
    expected: new Decimal(800000)
      .times(50)
      .plus(new Decimal(800000).times(25))
      .plus('20000000')
      .times(100000000)
      .toString(),
  });
  getTest({
    height: 1600002,
    genesis: GENESIS.test,
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
    genesis: GENESIS.main,
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
    genesis: GENESIS.test,
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
    genesis: GENESIS.main,
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
    genesis: GENESIS.test,
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
    genesis: GENESIS.main,
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
