const BlocksAdder = require('./BlocksAdder');
const checkBlocksSynced = require('./checkBlocksSynced');
const NetworkHelper = require('../../lib/NetworkHelper');
const BlockchainParser = require('../../../server/lib/BlockchainParser');

module.exports = async function (job) {
  if(job.data.type === 'check-synced') {
    return await checkBlocksSynced();
  }
  else {
    const blocksAdder = new BlocksAdder(new NetworkHelper(), new BlockchainParser());
    return await blocksAdder.doJob(job);
  }
};