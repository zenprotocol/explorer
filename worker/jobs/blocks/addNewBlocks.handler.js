const BlocksAdder = require('./BlocksAdder');
const NetworkHelper = require('../../lib/NetworkHelper');
const BlockchainParser = require('../../../server/lib/BlockchainParser');
const blocksAdder = new BlocksAdder(new NetworkHelper(), new BlockchainParser());

module.exports = async function (job) {
  if(job.data.type === 'check-synced') {
    return await blocksAdder.checkBlocksSynced(job);
  }
  else {
    return await blocksAdder.addNewBlocks(job);
  }
};