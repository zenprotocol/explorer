const getChain = require('../../../../server/lib/getChain');
const QueueError = require('../../../lib/QueueError');
const CGPWinnerCalculator = require('./CGPWinnerCalculator');

let cgpWinnerCalculator;

module.exports = async function(job) {
  // instantiate with the current chain
  if (!cgpWinnerCalculator) {
    const chain = await getChain();
    if (chain) {
      // instantiate only if we have a chain
      cgpWinnerCalculator = new CGPWinnerCalculator({ chain });
    }
  }

  if (cgpWinnerCalculator) {
    return await cgpWinnerCalculator.doJob(job);
  }

  throw new QueueError(new Error('Could not start job - Chain is not available yet'));
};
