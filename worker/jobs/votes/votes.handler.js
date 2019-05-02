const VotesAdder = require('./VotesAdder');
const BlockchainParser = require('../../../server/lib/BlockchainParser');
const getChain = require('../../../server/lib/getChain');
const QueueError = require('../../lib/QueueError');
const config = require('../../../server/config/Config');

let votesAdder;

module.exports = async function(job) {
  // instantiate with the current chain
  if (!votesAdder) {
    const chain = await getChain();
    if (chain) {
      // instantiate only if we have a chain
      votesAdder = new VotesAdder({
        blockchainParser: new BlockchainParser(chain),
        contractId: config.get('GOVERNANCE_CONTRACT_ID'),
      });
    }
  }

  if (votesAdder) {
    return await votesAdder.doJob(job);
  }

  throw new QueueError(new Error('Could not start job - Chain is not available yet'));
};
