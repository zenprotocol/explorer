const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const CGPVotesAdder = require('../../../CGPVotesAdder');
const contractId = require('../modules/contractId');

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given no contractId', async given => {
    try {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        chain: 'test',
        cgpFundPayoutBallot: contractId.cgpFundPayoutBallot,
      });
      before(cgpVotesAdder);
      await cgpVotesAdder.doJob();
      t.fail(`${given}: should throw an error`);
    } catch (error) {
      t.pass(`${given}: should throw an error`);
    }
    after();
  });

  await wrapTest('Given no cgp fund payout ballot', async given => {
    try {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        chain: 'test',
        contractIdFund: contractId.contractIdFund,
        contractIdVoting: contractId.contractIdVoting,
      });
      before(cgpVotesAdder);
      await cgpVotesAdder.doJob();
      t.fail(`${given}: should throw an error`);
    } catch (error) {
      t.pass(`${given}: should throw an error`);
    }
    after();
  });

  await wrapTest('Given no chain', async given => {
    try {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        ...contractId,
      });
      before(cgpVotesAdder);
      await cgpVotesAdder.doJob();
      t.fail(`${given}: should throw an error`);
    } catch (error) {
      t.pass(`${given}: should throw an error`);
    }
    after();
  });
};
