const fs = require('fs');
const path = require('path');
const block = require('./data/block');
const realSerializedBlocks = require('./data/blockchain-blocks.json');
const serializeBlock = require('./data/serializeBlock');

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
    networkHelper.getLatestBlockNumberFromNode = function () {
      return hasFalsyValues ? 2 : latestBlockNumber;
    };
    networkHelper.getSerializedBlocksFromNode = function ({ blockNumber, take = 1 } = {}) {
      const blocks = [];
      for (let i = blockNumber; i > Math.max(0, blockNumber - take); i--) {
        const filePath = `./data/blockNumber${i}.json`;
        if (hasFalsyValues || isNaN(blockNumber) || blockNumber < 1) {
          blocks.push({
            blockNumber: i,
            rawBlock: serializeBlock(
              block({ blockNumber, falsyBlock, falsyTransaction, falsyInput, falsyOutput })
            ),
          });
        } else if (fs.existsSync(path.join(__dirname, filePath))) {
          blocks.push({
            blockNumber: i,
            rawBlock: serializeBlock(require(filePath)),
          });
        } else {
          blocks.push(realSerializedBlocks[realSerializedBlocks.length - i]);
        }
      }
      return Promise.resolve(blocks);
    };
    networkHelper.getBlockchainInfo = function () {
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
  },
};
