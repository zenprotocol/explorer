const getChain = require('../../../server/lib/getChain');
const config = require('../../../server/config/Config');
const NetworkHelper = require('../../lib/NetworkHelper');
const QueueError = require('../../lib/QueueError');
const ReorgProcessor = require('./ReorgProcessor');

module.exports = async function (job) {
  const chain = await getChain();
  if (chain) {
    const reorgProcessor = new ReorgProcessor(new NetworkHelper(), config.get('GENESIS_TOTAL_ZP'));
    return await reorgProcessor.doJob(job);
  }

  throw new QueueError(new Error('Could not start job - Chain is not available yet'));
};
