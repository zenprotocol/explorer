'use strict';

const config = require('../../../config/Config');
const getChain = require('../../../lib/getChain');
const blocksBLL = require('../blocks/blocksBLL');

function getIntervalLength(chain) {
  return config.get(`cgp:${chain}:intervalLength`);
}

async function getCurrentInterval() {
  const chain = await getChain();
  const currentBlock = await blocksBLL.getCurrentBlockNumber();
  return Math.floor((currentBlock - 1) / getIntervalLength(chain));
}

async function getIntervalBlocks(interval) {
  const chain = await getChain();
  const intervalLength = getIntervalLength(chain);
  const snapshot = interval * intervalLength + intervalLength * 0.9;
  const tally = (interval + 1) * intervalLength;

  return {
    snapshot,
    tally,
  };
}

module.exports = {
  getIntervalLength,
  getCurrentInterval,
  getIntervalBlocks,
};
