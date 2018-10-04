const Service = require('../../server/lib/Service');
const NetworkError = require('../../server/lib/NetworkError');

class NetworkHelper {
  async getLatestBlockNumberFromNode() {
    const info = await Service.blocks.getChainInfo();
    if (!info.blocks) {
      throw new NetworkError(null, 'Chain info does not contain a blocks key');
    }
    return info.blocks;
  }

  async getBlockFromNode(blockNumber) {
    return await Service.blocks.getBlock(blockNumber);
  }

  async getBlockchainInfo() {
    return await Service.blocks.getChainInfo();
  }

  async getActiveContractsFromNode() {
    return await Service.contracts.getActiveContracts();
  }

  async getZenNodeLatestTag() {
    const tags = await Service.zen.getZenNodeTags();
    return tags.length ? tags[0].name : 'v0.9';
  }

  async getZenWalletLatestTag() {
    const release = await Service.zen.getWalletLatestRelease();
    return release ? release.tag_name : 'v0.9';
  }
}
module.exports = NetworkHelper;