const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const CGPVotesAdder = require('../../../CGPVotesAdder');
const contractId = require('../modules/contractId');
const { addDemoData, addCommands } = require('../modules/addDemoData');
const getDemoCommand = require('../modules/getDemoCommand');
const getValidMessageBody = require('../modules/getValidMessageBody');

const blockchainParser = new BlockchainParser('test');

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given no commands', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...contractId,
    });
    before(cgpVotesAdder);
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(result === 0 && votes.length === 0, `${given}: should not add any votes`);
    after();
  });

  // helper
  function testSingleWrongCommand({ given, command }) {
    return wrapTest(given, async () => {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser,
        chain: 'test',
        ...contractId,
      });
      before(cgpVotesAdder);
      await addDemoData({ commands: [command], blockchainParser });
      const result = await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll();
      t.assert(
        result === 1 && votes.length === 1 && votes[0].address === null && votes[0].ballot === null,
        `${given}: should add an empty vote`
      );
      after();
    });
  }

  await testSingleWrongCommand({
    given: 'Given a command with wrong command string',
    command: getDemoCommand({ command: 'WRONG', messageBody: getValidMessageBody('Payout') }),
  });
  await testSingleWrongCommand({
    given: 'Given a command with opposite command string',
    command: getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Payout') }),
  });

  await wrapTest('Given a valid payout vote', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...contractId,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Payout');
    const ballot = messageBody.dict[0][1].string;
    await addDemoData({
      commands: [getDemoCommand({ command: 'Payout', messageBody})],
      blockchainParser,
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 2 &&
        votes.length === 2 &&
        votes[0].ballot === ballot &&
        votes[1].ballot === ballot,
      `${given}: should add the vote`
    );
    after();
  });

  await wrapTest('Given a valid allocation vote', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...contractId,
    });
    before(cgpVotesAdder);
    await addDemoData({
      commands: [
        getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
      blockchainParser,
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 2 &&
        votes.length === 2 &&
        votes[0].ballot === '0106' &&
        votes[1].ballot === '0106',
      `${given}: should add the vote`
    );
    after();
  });

  // several commands
  await wrapTest('Given 2 commands with valid votes', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...contractId,
    });
    before(cgpVotesAdder);
    await addDemoData({
      commands: [
        getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
      blockchainParser,
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 4 &&
        votes.length === 4 &&
        votes.every(vote => vote.address) &&
        votes.every(vote => vote.ballot) &&
        votes.filter(vote => vote.type === 'payout').length === 2,
      `${given}: should add all of the votes`
    );
    after();
  });

  await wrapTest(
    'Given command with valid votes and a 2nd command with invalid votes',
    async given => {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser,
        chain: 'test',
        ...contractId,
      });
      before(cgpVotesAdder);
      await addDemoData({
        blockchainParser,
        commands: [
          getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
          getDemoCommand({
            command: 'Allocation',
            messageBody: {
              // no signatures
              dict: [
                [
                  'Payout',
                  {
                    string:
                      '02344dc343f0ac6d0d1d5d6e6388a9dc495ff230b650565455f040c4abd565c1d301000000',
                  },
                ],
              ],
            },
          }),
        ],
      });
      const result = await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll();
      t.assert(
        result === 3 &&
          votes.length === 3 &&
          votes.filter(vote => vote.type === 'payout').length === 2,
        `${given}: should add all of the valid votes and 1 empty vote`
      );
      after();
    }
  );

  // worker runs 2 times
  await wrapTest('Given the worker runs 2 times with no new votes on 2nd time', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...contractId,
    });
    before(cgpVotesAdder);
    await addDemoData({
      blockchainParser,
      commands: [
        getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
    });
    const result1 = await cgpVotesAdder.doJob();
    const result2 = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result1 === 4 &&
        result2 === 0 &&
        votes.length === 4 &&
        votes.every(vote => vote.address) &&
        votes.every(vote => vote.ballot) &&
        votes.filter(vote => vote.type === 'payout').length === 2,
      `${given}: should add all of the votes from the first time and none from 2nd`
    );
    after();
  });

  await wrapTest('Given the worker runs 2 times with new votes on 2nd time', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...contractId,
    });
    before(cgpVotesAdder);
    await addDemoData({
      blockchainParser,
      commandsBlockNumber: 91,
      commands: [
        getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
    });
    const result1 = await cgpVotesAdder.doJob();
    await addCommands({
      commandsBlockNumber: 93,
      commands: [getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') })],
    });
    const result2 = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result1 === 4 &&
        result2 === 2 &&
        votes.length === 6 &&
        votes.every(vote => vote.address) &&
        votes.every(vote => vote.ballot) &&
        votes.filter(vote => vote.type === 'payout').length === 4,
      `${given}: should add all of the votes from the first time and from the 2nd`
    );
    after();
  });
};
