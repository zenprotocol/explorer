'use strict';

const { Decimal } = require('decimal.js');

const HALVING = 800000;
const GENESIS_ZP = {
  main: '20000000',
  test: '0.00000001',
};

/**
 * Calculates the total amount of ZP Kalapas at a given height
 *
 * @param {Object} props
 * @param {(number|string)} props.height - the block height
 * @param {("main"|"test")} props.chain - the chain
 */
module.exports = function calcTotalZpByHeight({ height, chain = 'main' } = {}) {
  if (height == 0) {
    return '0';
  }

  const genesis = chain === 'main' ? GENESIS_ZP.main : GENESIS_ZP.test;

  // first period (period=1) starts at block 2 and continues until HALVING+1 inclusive
  const periodAtHeight = new Decimal(height - 1)
    .div(HALVING)
    .ceil()
    .toNumber();
  const rest = new Decimal(height - 1).modulo(HALVING);
  let reward = new Decimal(50);
  let total = new Decimal(0);
  for (let period = 1; period <= periodAtHeight; period++) {
    if (period < periodAtHeight || rest.isZero()) {
      total = new Decimal(HALVING).times(reward).plus(total);
      reward = reward.div(2);
    }
  }
  total = new Decimal(rest).times(reward).plus(total);

  return new Decimal(genesis)
    .plus(total)
    .times(100000000)
    .toString();
};
