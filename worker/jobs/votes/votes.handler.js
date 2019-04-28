const VotesAdder = require('./VotesAdder');
const BlockchainParser = require('../../../server/lib/BlockchainParser');
const getChain = require('../../../server/lib/getChain');
const QueueError = require('../../lib/QueueError');

let votesAdder;

module.exports = async function(job) {
  // instantiate with the current chain
  if (!votesAdder) {
    const chain = await getChain();
    if (chain) {
      // instantiate only if we have a chain
      votesAdder = new VotesAdder({
        blockchainParser: new BlockchainParser(chain),
        contractId: '00000000e3113f8bf9cf8b764d945d6f99c642bdb069d137bdd5f7e44f1e75947f58a044',
      });
    }
  }

  if (votesAdder) {
    return await votesAdder.doJob(job);
  }

  throw new QueueError(new Error('Could not start job - Chain is not available yet'));
};
