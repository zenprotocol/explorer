const BlockchainParser = require('../../../server/lib/BlockchainParser');
const getChain = require('../../../server/lib/getChain');
const QueueError = require('../../lib/QueueError');
const config = require('../../../server/config/Config');
const RepoVotesAdder = require('./RepoVotesAdder');
const CgpVotesAdder = require('./CgpVotesAdder');

/**
 * Handles both repo and cgp votes
 */
module.exports = async function(job) {
  if (job.data.type === 'repo') {
    // instantiate with the current chain
    const chain = await getChain();
    if (chain) {
      const repoVotesAdder = new RepoVotesAdder({
        blockchainParser: new BlockchainParser(chain),
        contractId: config.get('GOVERNANCE_CONTRACT_ID'),
        defaultCommitId: config.get('governance:defaultCommitId'),
      });
      return await repoVotesAdder.doJob(job);
    }
  } else if (job.data.type === 'cgp') {
    // instantiate with the current chain
    const chain = await getChain();
    if (chain) {
      const cgpVotesAdder = new CgpVotesAdder({
        chain,
        blockchainParser: new BlockchainParser(chain),
        contractIdFund: config.get('CGP_FUND_CONTRACT_ID'),
        contractIdVoting: config.get('CGP_VOTING_CONTRACT_ID'),
        cgpFundPayoutBallot: config.get('CGP_FUND_PAYOUT_BALLOT'),
        genesisTotal: config.get('GENESIS_TOTAL_ZP'),
      });
      return await cgpVotesAdder.doJob(job);
    }
  }

  throw new QueueError(new Error('Could not start job - Chain is not available yet'));
};
