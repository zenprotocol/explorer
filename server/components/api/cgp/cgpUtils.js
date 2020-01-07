'use strict';

const {mergeRight} = require('ramda');
const config = require('../../../config/Config');

function getIntervalLength(chain) {
  return config.get(`cgp:${chain}:intervalLength`);
}

function getCoinbaseMaturity(chain) {
  return config.get(`cgp:${chain}:coinbaseMaturity`);
}

function getIntervalByBlockNumber(chain, blockNumber) {
  return Math.ceil(blockNumber / getIntervalLength(chain));
}

function getIntervalBlocks(chain, interval) {
  const intervalLength = getIntervalLength(chain);
  const snapshot = (interval - 1) * intervalLength + intervalLength * 0.9;
  const tally = interval * intervalLength;

  return {
    snapshot,
    tally,
    coinbaseMaturity: tally + getCoinbaseMaturity(chain),
  };
}

/**
 * Get interval snapshot and tally blocks by:
 * 1. if interval is supplied, by that interval
 * 2. previous interval if currentBlock - prev.endHeight < 10,000
 * 3. on going interval
 */
function getRelevantIntervalBlocks(chain, interval, currentBlock) {
  let chosenInterval = interval;

  if (!chosenInterval) {
    const afterTallyBlocks = config.get(`cgp:${chain}:afterTallyBlocks`);
    const currentInterval = getIntervalByBlockNumber(chain, currentBlock);
    const intervalLength = getIntervalLength(chain);
    const shouldGetPrevInterval =
      currentInterval > 1 &&
      currentBlock - intervalLength * (currentInterval - 1) <= afterTallyBlocks;
    chosenInterval =
      currentInterval === 1 ? 1 : shouldGetPrevInterval ? currentInterval - 1 : currentInterval;
  }

  return mergeRight({ interval: chosenInterval }, getIntervalBlocks(chain, chosenInterval));
}

module.exports = {
  getIntervalLength,
  getCoinbaseMaturity,
  getIntervalByBlockNumber,
  getIntervalBlocks,
  getRelevantIntervalBlocks,
};
