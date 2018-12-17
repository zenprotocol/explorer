const infosDAL = require('../components/api/infos/infosDAL');

let chain = '';

module.exports = async function getChain() {
  if (!chain) {
    try {
      const info = await infosDAL.findByName('chain');
      if (info) {
        chain = info.value;
      }
    } catch (e) {
      // ignored
    }
  }
  return chain;
};
