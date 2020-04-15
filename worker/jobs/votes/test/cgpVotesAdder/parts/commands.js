const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const CGPVotesAdder = require('../../../CGPVotesAdder');
const cgpAdderParams = require('../modules/cgpAdderParams');
const { addDemoData, addCommands } = require('../modules/addDemoData');
const getDemoCommand = require('../modules/getDemoCommand');
const getValidMessageBody = require('../modules/getValidMessageBody');
const { addsEmptyVoteAssert } = require('../modules/asserts');

const blockchainParser = new BlockchainParser('test');

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given no commands', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
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
        ...cgpAdderParams,
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
    command: getDemoCommand({ command: 'WRONG', messageBody: getValidMessageBody('Nomination') }),
  });
  await testSingleWrongCommand({
    given: 'Given a command with command string opposite from type',
    command: getDemoCommand({ command: 'Nomination', messageBody: getValidMessageBody('Payout') }),
  });

  const testCommandRange = ({
    blockNumber,
    command,
    execBeforeJob,
    execAfterJob,
    given,
    should,
    assert,
  } = {}) =>
    wrapTest(given, async () => {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser,
        chain: 'test',
        ...cgpAdderParams,
      });
      before(cgpVotesAdder);
      await addDemoData({
        commandsBlockNumber: blockNumber,
        lastBlockNumber: 110,
        commands: [getDemoCommand({ command, messageBody: getValidMessageBody(command) })],
        blockchainParser,
      });
      if (typeof execBeforeJob === 'function') {
        await execBeforeJob();
      }
      await cgpVotesAdder.doJob();
      if (typeof execAfterJob === 'function') {
        await execAfterJob();
      }
      const votes = await cgpDAL.findAll();
      t.assert(assert({ votes }), `Given ${given}: should ${should}`);
      after();
    });

  await testCommandRange({
    blockNumber: 40,
    command: 'Nomination',
    given: 'a command several blocks before snapshot',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testCommandRange({
    blockNumber: 89,
    command: 'Nomination',
    given: 'a Nomination command 1 block before snapshot',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testCommandRange({
    blockNumber: 90,
    command: 'Nomination',
    given: 'a Nomination command on snapshot block',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testCommandRange({
    blockNumber: 101,
    command: 'Payout',
    execBeforeJob: async () => {
      await addCommands({
        commandsBlockNumber: 91,
        commands: [
          getDemoCommand({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
        ],
      });
    },
    given: 'a Payout command after tally block',
    should: 'add an empty vote',
    assert: ({ votes }) => votes.length === 3 && !votes.find(vote => vote.type === 'payout'),
  });
  await testCommandRange({
    blockNumber: 100,
    command: 'Payout',
    execBeforeJob: async () => {
      await addCommands({
        commandsBlockNumber: 91,
        commands: [
          getDemoCommand({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
        ],
      });
    },
    given: 'a Payout command at the tally block',
    should: 'add the vote',
    assert: ({ votes }) => votes.length === 4 && votes.every(vote => vote.ballot !== null),
  });
  await testCommandRange({
    blockNumber: 100,
    command: 'Allocation',
    given: 'a Allocation command at the tally block',
    should: 'add the vote',
    assert: ({ votes }) =>
      votes.length === 2 && votes[0].ballot !== null && votes[1].ballot !== null,
  });
  await testCommandRange({
    blockNumber: 95,
    command: 'Nomination',
    given: 'a Nomination command at the end height of phase 0',
    should: 'add the vote',
    assert: ({ votes }) =>
      votes.length === 2 && votes[0].ballot !== null && votes[1].ballot !== null,
  });
  await testCommandRange({
    blockNumber: 91,
    command: 'Payout',
    given: 'a Payout command in phase 0',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testCommandRange({
    blockNumber: 91,
    command: 'Allocation',
    given: 'a Allocation command in phase 0',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testCommandRange({
    blockNumber: 96,
    command: 'Nomination',
    given: 'a Nomination command in phase 1',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });

  await wrapTest('Given a valid nomination vote', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Nomination');
    const ballot = messageBody.dict[0][1].string;
    await addDemoData({
      commands: [getDemoCommand({ command: 'Nomination', messageBody })],
      blockchainParser,
      commandsBlockNumber: 91,
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

  await wrapTest('Given a valid payout vote', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Nomination');
    const ballot = messageBody.dict[0][1].string;
    await addDemoData({
      commands: [getDemoCommand({ command: 'Nomination', messageBody })],
      blockchainParser,
      commandsBlockNumber: 91,
    });
    await addCommands({
      commandsBlockNumber: 96,
      commands: [getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') })],
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 4 &&
        votes.length === 4 &&
        votes[0].ballot === ballot &&
        votes[1].ballot === ballot &&
        votes[2].ballot === ballot &&
        votes[3].ballot === ballot,
      `${given}: should add the vote`
    );
    after();
  });

  await wrapTest('Given a valid allocation vote', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      commands: [
        getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
      blockchainParser,
      commandsBlockNumber: 96,
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
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      commands: [
        getDemoCommand({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
      ],
      blockchainParser,
      commandsBlockNumber: 91,
    });
    await addCommands({
      commandsBlockNumber: 96,
      commands: [
        getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 6 &&
        votes.length === 6 &&
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
        ...cgpAdderParams,
      });
      before(cgpVotesAdder);
      await addDemoData({
        commands: [
          getDemoCommand({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
        ],
        blockchainParser,
        commandsBlockNumber: 91,
      });
      await addCommands({
        commandsBlockNumber: 96,
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
        result === 5 &&
          votes.length === 5 &&
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
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      commands: [
        getDemoCommand({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
      ],
      blockchainParser,
      commandsBlockNumber: 91,
    });
    await addCommands({
      commandsBlockNumber: 96,
      commands: [
        getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
    });
    const result1 = await cgpVotesAdder.doJob();
    const result2 = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result1 === 6 &&
        result2 === 0 &&
        votes.length === 6 &&
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
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      commands: [
        getDemoCommand({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
      ],
      blockchainParser,
      commandsBlockNumber: 91,
    });
    await addCommands({
      commandsBlockNumber: 96,
      commands: [
        getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoCommand({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
    });
    const result1 = await cgpVotesAdder.doJob();
    await addCommands({
      commandsBlockNumber: 97,
      commands: [getDemoCommand({ command: 'Payout', messageBody: getValidMessageBody('Payout') })],
    });
    const result2 = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result1 === 6 &&
        result2 === 2 &&
        votes.length === 8 &&
        votes.every(vote => vote.address) &&
        votes.every(vote => vote.ballot) &&
        votes.filter(vote => vote.type === 'payout').length === 4,
      `${given}: should add all of the votes from the first time and from the 2nd`
    );
    after();
  });
};
