const block = require('./data/block');

module.exports = {
  mockNetworkHelper(networkHelper) {
    networkHelper.getLatestBlockNumberFromNode = function() {
      return 2;
    };
    networkHelper.getBlockFromNode = function(blockNumber) {
      return block(blockNumber);
    };
  },
};
