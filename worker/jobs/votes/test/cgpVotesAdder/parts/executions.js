const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const CgpVotesAdder = require('../../../CgpVotesAdder');
const cgpAdderParams = require('../modules/cgpAdderParams');
const { addDemoData, addExecutions } = require('../modules/addDemoData');
const getDemoExecution = require('../modules/getDemoExecution');
const getValidMessageBody = require('../modules/getValidMessageBody');
const { addsEmptyVoteAssert } = require('../modules/asserts');

const blockchainParser = new BlockchainParser('test');

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given no executions', async given => {
    const cgpVotesAdder = new CgpVotesAdder({
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
  function testSingleWrongExecution({ given, execution }) {
    return wrapTest(given, async () => {
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser,
        chain: 'test',
        ...cgpAdderParams,
      });
      before(cgpVotesAdder);
      await addDemoData({ executions: [execution], blockchainParser });
      const result = await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll();
      t.assert(
        result === 1 && votes.length === 1 && votes[0].address === null && votes[0].ballot === null,
        `${given}: should add an empty vote`
      );
      after();
    });
  }

  await testSingleWrongExecution({
    given: 'Given a execution with wrong command string',
    execution: getDemoExecution({ command: 'WRONG', messageBody: getValidMessageBody('Nomination') }),
  });
  await testSingleWrongExecution({
    given: 'Given a execution with command string opposite from type',
    execution: getDemoExecution({ command: 'Nomination', messageBody: getValidMessageBody('Payout') }),
  });

  const testExecutionRange = ({
    blockNumber,
    command,
    execBeforeJob,
    execAfterJob,
    given,
    should,
    assert,
  } = {}) =>
    wrapTest(given, async () => {
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser,
        chain: 'test',
        ...cgpAdderParams,
      });
      before(cgpVotesAdder);
      await addDemoData({
        executionsBlockNumber: blockNumber,
        lastBlockNumber: 110,
        executions: [getDemoExecution({ command, messageBody: getValidMessageBody(command) })],
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

  await testExecutionRange({
    blockNumber: 40,
    command: 'Nomination',
    given: 'a execution several blocks before snapshot',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testExecutionRange({
    blockNumber: 89,
    command: 'Nomination',
    given: 'a Nomination execution 1 block before snapshot',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testExecutionRange({
    blockNumber: 90,
    command: 'Nomination',
    given: 'a Nomination execution on snapshot block',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testExecutionRange({
    blockNumber: 101,
    command: 'Payout',
    execBeforeJob: async () => {
      await addExecutions({
        executionsBlockNumber: 91,
        executions: [
          getDemoExecution({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
        ],
      });
    },
    given: 'a Payout command after tally block',
    should: 'add an empty vote',
    assert: ({ votes }) => votes.length === 3 && !votes.find(vote => vote.type === 'payout'),
  });
  await testExecutionRange({
    blockNumber: 100,
    command: 'Payout',
    execBeforeJob: async () => {
      await addExecutions({
        executionsBlockNumber: 91,
        executions: [
          getDemoExecution({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
        ],
      });
    },
    given: 'a Payout command at the tally block',
    should: 'add the vote',
    assert: ({ votes }) => votes.length === 4 && votes.every(vote => vote.ballot !== null),
  });
  await testExecutionRange({
    blockNumber: 100,
    command: 'Allocation',
    given: 'a Allocation command at the tally block',
    should: 'add the vote',
    assert: ({ votes }) =>
      votes.length === 2 && votes[0].ballot !== null && votes[1].ballot !== null,
  });
  await testExecutionRange({
    blockNumber: 95,
    command: 'Nomination',
    given: 'a Nomination command at the end height of phase 0',
    should: 'add the vote',
    assert: ({ votes }) =>
      votes.length === 2 && votes[0].ballot !== null && votes[1].ballot !== null,
  });
  await testExecutionRange({
    blockNumber: 91,
    command: 'Payout',
    given: 'a Payout command in phase 0',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testExecutionRange({
    blockNumber: 91,
    command: 'Allocation',
    given: 'a Allocation command in phase 0',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });
  await testExecutionRange({
    blockNumber: 96,
    command: 'Nomination',
    given: 'a Nomination command in phase 1',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });

  await wrapTest('Given a valid nomination vote', async given => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Nomination');
    const ballot = messageBody.dict[0][1].string;
    await addDemoData({
      executions: [getDemoExecution({ command: 'Nomination', messageBody })],
      blockchainParser,
      executionsBlockNumber: 91,
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 2 &&
        votes.length === 2 &&
        votes.every(v => v.ballot === ballot && v.blockNumber === 91 && v.txHash.length > 0),
      `${given}: should add the vote`
    );
    after();
  });

  await wrapTest('Given a valid payout vote', async given => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Nomination');
    const ballot = messageBody.dict[0][1].string;
    await addDemoData({
      executions: [getDemoExecution({ command: 'Nomination', messageBody })],
      blockchainParser,
      executionsBlockNumber: 91,
    });
    await addExecutions({
      executionsBlockNumber: 96,
      executions: [getDemoExecution({ command: 'Payout', messageBody: getValidMessageBody('Payout') })],
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 4 &&
        votes.length === 4 &&
        votes.every(v => v.ballot === ballot && v.blockNumber > 0 && v.txHash.length > 0),
      `${given}: should add the vote`
    );
    after();
  });

  await wrapTest('Given a valid allocation vote', async given => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      executions: [
        getDemoExecution({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
      blockchainParser,
      executionsBlockNumber: 96,
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 2 &&
        votes.length === 2 &&
        votes.every(v => v.ballot === '0106' && v.blockNumber > 0 && v.txHash.length > 0),
      `${given}: should add the vote`
    );
    after();
  });

  // several executions
  await wrapTest('Given 2 executions with valid votes', async given => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      executions: [
        getDemoExecution({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
      ],
      blockchainParser,
      executionsBlockNumber: 91,
    });
    await addExecutions({
      executionsBlockNumber: 96,
      executions: [
        getDemoExecution({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoExecution({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
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
    'Given executions with valid votes and a 2nd executions with invalid votes',
    async given => {
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser,
        chain: 'test',
        ...cgpAdderParams,
      });
      before(cgpVotesAdder);
      await addDemoData({
        executions: [
          getDemoExecution({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
        ],
        blockchainParser,
        executionsBlockNumber: 91,
      });
      await addExecutions({
        executionsBlockNumber: 96,
        executions: [
          getDemoExecution({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
          getDemoExecution({
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
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      executions: [
        getDemoExecution({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
      ],
      blockchainParser,
      executionsBlockNumber: 91,
    });
    await addExecutions({
      executionsBlockNumber: 96,
      executions: [
        getDemoExecution({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoExecution({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
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
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      executions: [
        getDemoExecution({ command: 'Nomination', messageBody: getValidMessageBody('Nomination') }),
      ],
      blockchainParser,
      executionsBlockNumber: 91,
    });
    await addExecutions({
      executionsBlockNumber: 96,
      executions: [
        getDemoExecution({ command: 'Payout', messageBody: getValidMessageBody('Payout') }),
        getDemoExecution({ command: 'Allocation', messageBody: getValidMessageBody('Allocation') }),
      ],
    });
    const result1 = await cgpVotesAdder.doJob();
    // change message body to have different pks so it is not double vote
    const newMsgBody = getValidMessageBody('Payout');
    newMsgBody.dict[1][1].dict[0][0] = '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c';
    newMsgBody.dict[1][1].dict[1][0] = '038a20015c9309fb623ee2c9fee2cfb22d6a0fc89e437a8926733b15efd13b1556';
    await addExecutions({
      executionsBlockNumber: 97,
      executions: [getDemoExecution({ command: 'Payout', messageBody: newMsgBody })],
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
