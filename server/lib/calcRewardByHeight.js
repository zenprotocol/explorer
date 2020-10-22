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
module.exports = function calcRewardByHeight(height) {
  if (height < 2 || isNaN(height)) {
    return '0';
  }

  // first period (period=1) starts at block 2 and continues until HALVING+1 inclusive
  const periodAtHeight = new Decimal(height - 1).div(HALVING).ceil().toNumber();

  return new Decimal(5000000000).dividedBy(new Decimal(2).pow(periodAtHeight - 1)).toString();
};
