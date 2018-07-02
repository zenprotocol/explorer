const block = require('./data/block');

module.exports = {
  mockNetworkHelper(networkHelper, {falsyBlock, falsyTransaction, falsyInput, falsyOutput} = {}) {
    networkHelper.getLatestBlockNumberFromNode = function() {
      return 2;
    };
    networkHelper.getBlockFromNode = function(blockNumber) {
      return block({blockNumber, falsyBlock, falsyTransaction, falsyInput, falsyOutput});
    };
  },
};
