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
}
module.exports = NetworkHelper;