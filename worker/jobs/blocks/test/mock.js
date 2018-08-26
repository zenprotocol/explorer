const block = require('./data/block');

const REAL_BLOCKS_MAX_NUMBER = 4;

module.exports = {
  mockNetworkHelper(networkHelper, {falsyBlock, falsyTransaction, falsyInput, falsyOutput, latestBlockNumber = REAL_BLOCKS_MAX_NUMBER} = {}) {
    const hasFalsyValues = falsyBlock || falsyTransaction || falsyInput || falsyOutput;
    networkHelper.getLatestBlockNumberFromNode = function() {
      return hasFalsyValues? 2 : latestBlockNumber;
    };
    networkHelper.getBlockFromNode = function(blockNumber) {
      if (!hasFalsyValues && !isNaN(blockNumber) && blockNumber > 0) {
        return require(`./data/blockNumber${blockNumber}.json`);
      }
      return block({blockNumber, falsyBlock, falsyTransaction, falsyInput, falsyOutput});
    };
  },
};
