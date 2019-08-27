const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const CGPVotesAdder = require('../../../CGPVotesAdder');
const CONTRACT_ID = require('../modules/contractId');

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given no contractId', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser: new BlockchainParser('test'),
      chain: 'test',
    });
    before(cgpVotesAdder);
    try {
      await cgpVotesAdder.doJob();
      t.fail(`${given}: should throw an error`);
    } catch (error) {
      t.pass(`${given}: should throw an error`);
    }
    after();
  });

  await wrapTest('Given no chain', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser: new BlockchainParser('test'),
      contractId: CONTRACT_ID,
    });
    before(cgpVotesAdder);
    try {
      await cgpVotesAdder.doJob();
      t.fail(`${given}: should throw an error`);
    } catch (error) {
      t.pass(`${given}: should throw an error`);
    }
    after();
  });
};
