const activeContracts = require('./data/activeContracts.json');

module.exports = {
  mockNetworkHelper(networkHelper) {
    networkHelper.getActiveContractsFromNode = function() {
      return JSON.parse(JSON.stringify(activeContracts));
    };
  },
};
