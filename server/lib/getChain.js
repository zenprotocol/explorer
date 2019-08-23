const infosDAL = require('../components/api/infos/infosDAL');
const BlockchainParser = require('./BlockchainParser');

let chain = '';
const blockchainParser = new BlockchainParser();

module.exports = async function getChain() {
  if (!chain) {
    try {
      const info = await infosDAL.findByName('chain');
      if (info) {
        chain = blockchainParser.getChainBaseName(info.value);
      }
    } catch (e) {
      // ignored
    }
  }
  return chain;
};
