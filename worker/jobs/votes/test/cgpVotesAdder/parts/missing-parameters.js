const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const CgpVotesAdder = require('../../../CgpVotesAdder');
const cgpAdderParams = require('../modules/cgpAdderParams');

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given no contractId', async given => {
    try {
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        chain: 'test',
        genesisTotal: cgpAdderParams.genesisTotal,
        cgpFundPayoutBallot: cgpAdderParams.cgpFundPayoutBallot,
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
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        chain: 'test',
        genesisTotal: cgpAdderParams.genesisTotal,
        contractIdFund: cgpAdderParams.contractIdFund,
        contractIdVoting: cgpAdderParams.contractIdVoting,
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
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        genesisTotal: cgpAdderParams.genesisTotal,
        ...cgpAdderParams,
      });
      before(cgpVotesAdder);
      await cgpVotesAdder.doJob();
      t.fail(`${given}: should throw an error`);
    } catch (error) {
      t.pass(`${given}: should throw an error`);
    }
    after();
  });

  await wrapTest('Given no genesis total', async given => {
    try {
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        chain: 'test',
        cgpFundPayoutBallot: cgpAdderParams.cgpFundPayoutBallot,
        contractIdFund: cgpAdderParams.contractIdFund,
        contractIdVoting: cgpAdderParams.contractIdVoting,
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
