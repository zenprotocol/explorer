const BlocksAdder = require('./BlocksAdder');
const checkBlocksSynced = require('./checkBlocksSynced');
const NetworkHelper = require('../../lib/NetworkHelper');
const BlockchainParser = require('../../../server/lib/BlockchainParser');
const getChain = require('../../../server/lib/getChain');
const config = require('../../../server/config/Config');
const QueueError = require('../../lib/QueueError');

module.exports = async function (job) {
  if(job.data.type === 'check-synced') {
    return await checkBlocksSynced();
  }
  else {
    const chain = await getChain();
    if(chain) {
      const blocksAdder = new BlocksAdder(new NetworkHelper(), new BlockchainParser(chain), config.get('GENESIS_TOTAL_ZP'));
      return await blocksAdder.doJob(job);
    }

    throw new QueueError(new Error('Could not start job - Chain is not available yet'));
  }

};