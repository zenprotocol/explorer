module.exports = {
  mockNetworkHelper(networkHelper) {
    networkHelper.getZenNodeLatestTag = async function() {
      return 'v0.9.123';
    };
    networkHelper.getZenWalletLatestTag = async function() {
      return 'v0.9.456';
    };
    networkHelper.getBlockchainInfo = async function() {
      return {};
    };
  },
};
