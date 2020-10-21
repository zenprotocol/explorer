const BlockchainParser = require('./BlockchainParser');
const NodeService = require('./Service');

let chain = '';
const blockchainParser = new BlockchainParser();

module.exports = async function getChain() {
  if (!chain) {
    try {
      const blockchainInfo = await NodeService.blocks.getChainInfo();
      if ((blockchainInfo || {}).chain) {
        chain = blockchainParser.getChainBaseName(blockchainInfo.chain);
      }
    } catch (e) {
      // ignored
    }
  }
  return chain;
};
