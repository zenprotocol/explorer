const block = require('./data/block');

const REAL_BLOCKS_MAX_NUMBER = 4;

module.exports = {
  mockNetworkHelper(
    networkHelper,
    {
      falsyBlock,
      falsyTransaction,
      falsyInput,
      falsyOutput,
      latestBlockNumber = REAL_BLOCKS_MAX_NUMBER,
    } = {}
  ) {
    const hasFalsyValues = falsyBlock || falsyTransaction || falsyInput || falsyOutput;
    networkHelper.getLatestBlockNumberFromNode = function() {
      return hasFalsyValues ? 2 : latestBlockNumber;
    };
    networkHelper.getBlockFromNode = function(blockNumber) {
      if (!hasFalsyValues && !isNaN(blockNumber) && blockNumber > 0) {
        return require(`./data/blockNumber${blockNumber}.json`);
      }
      return block({ blockNumber, falsyBlock, falsyTransaction, falsyInput, falsyOutput });
    };
    networkHelper.getBlockchainInfo = function() {
      return {
        chain: 'main',
        blocks: 37180,
        headers: 37180,
        difficulty: 319068.440736133,
        medianTime: 1539187805540,
        initialBlockDownload: false,
        tip: '00000000000024d4325b6411830b85df6c2eca39803184fa8f68be9f2366f7b8',
      };
    };
    networkHelper.getBlockRewardFromNode = function() {
      return 5000000000;
    };
  },
};
