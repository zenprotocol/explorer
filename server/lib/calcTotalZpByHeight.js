'use strict';

const { Decimal } = require('decimal.js');

const HALVING = 800000;

/**
 * Calculates the total amount of ZP Kalapas at a given height
 *
 * @param {Object} props
 * @param {(number|string)} props.height - the block height
 * @param {(number|string)} props.genesis - the genesis total in zp (not Kalapas)
 */
module.exports = function calcTotalZpByHeight({ height, genesis = '20000000' } = {}) {
  if (height == 0) {
    return '0';
  }

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
