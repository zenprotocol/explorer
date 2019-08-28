const SnapshotsTaker = require('./SnapshotsTaker');
const getChain = require('../../../server/lib/getChain');
const QueueError = require('../../lib/QueueError');

let snapshotsTaker;

module.exports = async function(job) {
  // instantiate with the current chain
  if (!snapshotsTaker) {
    const chain = await getChain();
    if (chain) {
      // instantiate only if we have a chain
      snapshotsTaker = new SnapshotsTaker({ chain });
    }
  }
  
  if (snapshotsTaker) {
    return await snapshotsTaker.doJob(job);
  }

  throw new QueueError(new Error('Could not start job - Chain is not available yet'));
};
