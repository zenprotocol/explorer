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

  async getBlocksFromNode({ blockNumber, take } = {}) {
    // get all blocks in batch
    // PREPARE FOR NEW API blockchain/blocks
    // BLOCKS ARE ORDERED HIGH TO LOW
    const nodeBlocksPromises = [];
    for (let i = blockNumber; i > blockNumber - take; i--) {
      nodeBlocksPromises.push(
        this.getBlockFromNode(i).then((block) =>
          Object.assign(block, {
            blockNumber: block.header.blockNumber,
          })
        )
      );
    }

    return Promise.all(nodeBlocksPromises);
    // return await Service.blocks.getBlocks({blockNumber, take});
  }

  async getBlockchainInfo() {
    return await Service.blocks.getChainInfo();
  }

  async getActiveContractsFromNode() {
    return await Service.contracts.getActiveContracts();
  }

  async getContractExecutionsFromNode(data) {
    return await Service.contracts.getExecutions(data);
  }

  async getZenNodeLatestTag() {
    const release = await Service.zen.getZenNodeLatestRelease();
    return release ? release.tag_name : 'v0.9';
  }

  async getZenWalletLatestTag() {
    const release = await Service.zen.getWalletLatestRelease();
    return release ? release.tag_name : 'v0.9';
  }
}
module.exports = NetworkHelper;
