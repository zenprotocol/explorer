const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const CgpVotesAdder = require('../../../CgpVotesAdder');
const cgpAdderParams = require('../modules/cgpAdderParams');
const { addDemoData, addExecutions, addExecution } = require('../modules/addDemoData');
const getDemoExecution = require('../modules/getDemoExecution');
const getValidMessageBody = require('../modules/getValidMessageBody');

const blockchainParser = new BlockchainParser('test');

const BALLOTS = {
  payout: [
    '02011cb4afc2a1dd2c4f857460a7abe3efc67c24881fd33978d8a5f9a4cb25c14ef101000004',
    '020200eac6c58bed912ff310df9f6960e8ed5c28aac83b8a98964224bab1e06c779b9301000001',
  ],
  allocation: ['0105', '0106'],
};

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given a Nomination double vote, 1st already in db, different blocks', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Nomination');
    messageBody.dict[0][1].string = BALLOTS.payout[0];
    await addDemoData({
      executions: [getDemoExecution({ command: 'Nomination', messageBody })],
      executionsBlockNumber: 91,
      blockchainParser,
    });
    // 1st job
    await cgpVotesAdder.doJob();

    // change ballot
    messageBody.dict[0][1].string = BALLOTS.payout[1];
    // add the double vote
    await addExecution({
      blockNumber: 92,
      txIndex: 0,
      execution: getDemoExecution({ command: 'Nomination', messageBody }),
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 1 && votes.length === 3 && votes.every((v) => v.ballot !== BALLOTS.payout[1]),
      `${given}: should add an empty vote`
    );
    after();
  });
  await wrapTest('Given a Nomination double vote, 1st already in db, same block', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Nomination');
    messageBody.dict[0][1].string = BALLOTS.payout[0];
    await addDemoData({
      blockchainParser,
    });
    await addExecution({
      blockNumber: 92,
      txIndex: 0,
      execution: getDemoExecution({ command: 'Nomination', messageBody }),
    });
    // 1st job
    await cgpVotesAdder.doJob();

    // change ballot
    messageBody.dict[0][1].string = BALLOTS.payout[1];
    // add the double vote
    await addExecution({
      blockNumber: 92,
      txIndex: 1,
      execution: getDemoExecution({ command: 'Nomination', messageBody }),
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 1 && votes.length === 3 && votes.every((v) => v.ballot !== BALLOTS.payout[1]),
      `${given}: should add an empty vote`
    );
    after();
  });
  await wrapTest('Given a Nomination double vote, different executions, same batch, same block', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Nomination');
    messageBody.dict[0][1].string = BALLOTS.payout[0];
    await addDemoData({
      blockchainParser,
    });
    await addExecution({
      blockNumber: 92,
      txIndex: 0,
      execution: getDemoExecution({ command: 'Nomination', messageBody }),
    });

    // change ballot
    messageBody.dict[0][1].string = BALLOTS.payout[1];
    // add the double vote
    await addExecution({
      blockNumber: 92,
      txIndex: 1,
      execution: getDemoExecution({ command: 'Nomination', messageBody }),
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 3 && votes.length === 3 && votes.every((v) => v.ballot !== BALLOTS.payout[1]),
      `${given}: should add an empty vote`
    );
    after();
  });
  await wrapTest('Given a Payout double vote, 1st already in db', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);

    const messageBodyNomination = getValidMessageBody('Nomination');
    messageBodyNomination.dict[0][1].string = BALLOTS.payout[0];
    await addDemoData({
      executions: [getDemoExecution({ command: 'Nomination', messageBody: messageBodyNomination })],
      executionsBlockNumber: 91,
      blockchainParser,
    });
    // add the payout vote
    const messageBodyPayout = getValidMessageBody('Payout');
    messageBodyPayout.dict[0][1].string = BALLOTS.payout[0];
    await addExecution({
      blockNumber: 96,
      execution: getDemoExecution({ command: 'Payout', messageBody: messageBodyPayout }),
    });
    // 1st job
    await cgpVotesAdder.doJob();

    // same ballot, still a double vote
    // add the double vote
    await addExecution({
      blockNumber: 97,
      txIndex: 0,
      execution: getDemoExecution({ command: 'Payout', messageBody: messageBodyPayout }),
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    const numOfEmptyVotes = votes.reduce(
      (count, cur) => (cur.address === null ? count + 1 : count),
      0
    );
    t.assert(
      result === 1 && votes.length === 5 && numOfEmptyVotes === 1,
      `${given}: should add an empty vote`
    );
    after();
  });

  await wrapTest(
    'Given a Payout and Allocation from same address, 1st already in db',
    async (given) => {
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser,
        chain: 'test',
        ...cgpAdderParams,
      });
      before(cgpVotesAdder);

      const messageBodyNomination = getValidMessageBody('Nomination');
      messageBodyNomination.dict[0][1].string = BALLOTS.payout[0];
      await addDemoData({
        executions: [
          getDemoExecution({ command: 'Nomination', messageBody: messageBodyNomination }),
        ],
        executionsBlockNumber: 91,
        blockchainParser,
      });
      // add the payout vote
      const messageBodyPayout = getValidMessageBody('Payout');
      messageBodyPayout.dict[0][1].string = BALLOTS.payout[0];
      await addExecution({
        blockNumber: 96,
        execution: getDemoExecution({ command: 'Payout', messageBody: messageBodyPayout }),
      });
      // 1st job
      await cgpVotesAdder.doJob();

      // change the allocation msgBody to have same address as payout
      const messageBodyAllocation = getValidMessageBody('Allocation');
      messageBodyAllocation.dict[0] = messageBodyPayout.dict[1];
      // add the double vote
      await addExecution({
        blockNumber: 97,
        txIndex: 0,
        execution: getDemoExecution({ command: 'Allocation', messageBody: messageBodyAllocation }),
      });
      const result = await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll();
      const numOfEmptyVotes = votes.reduce(
        (count, cur) => (cur.address === null ? count + 1 : count),
        0
      );
      t.assert(
        result === 2 && votes.length === 6 && numOfEmptyVotes === 0,
        `${given}: should add the allocation votes`
      );
      after();
    }
  );

  await wrapTest(
    'Given a Nomination double vote, all in same batch, different blocks',
    async (given) => {
      const cgpVotesAdder = new CgpVotesAdder({
        blockchainParser,
        chain: 'test',
        ...cgpAdderParams,
      });
      before(cgpVotesAdder);
      const messageBody1 = getValidMessageBody('Nomination');
      const messageBody2 = getValidMessageBody('Nomination');
      messageBody1.dict[0][1].string = BALLOTS.payout[0];
      messageBody2.dict[0][1].string = BALLOTS.payout[1];
      await addDemoData({
        blockchainParser,
      });

      await Promise.all([
        addExecution({
          blockNumber: 91,
          txIndex: 0,
          execution: getDemoExecution({ command: 'Nomination', messageBody: messageBody1 }),
        }),
        addExecution({
          blockNumber: 92,
          txIndex: 0,
          execution: getDemoExecution({ command: 'Nomination', messageBody: messageBody2 }),
        }),
      ]);
      const result = await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll();
      t.assert(
        result === 3 && votes.length === 3 && votes.every((v) => v.ballot !== BALLOTS.payout[1]),
        `${given}: should add an empty vote`
      );
      after();
    }
  );

  await wrapTest('Given a double Nomination vote in the same execution', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody1 = getValidMessageBody('Nomination');
    messageBody1.dict[0][1].string = BALLOTS.payout[0];
    // add the first signature entree again
    messageBody1.dict[1][1].dict.push(messageBody1.dict[1][1].dict[0]);
    await addDemoData({
      blockchainParser,
    });

    await Promise.all([
      addExecution({
        blockNumber: 91,
        txIndex: 0,
        execution: getDemoExecution({ command: 'Nomination', messageBody: messageBody1 }),
      }),
    ]);
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    const numOfEmptyVotes = votes.reduce(
      (count, cur) => (cur.address === null ? count + 1 : count),
      0
    );
    t.assert(
      result === 2 && votes.length === 2 && numOfEmptyVotes === 0,
      `${given}: should only add the valid votes`
    );
    after();
  });
  await wrapTest('Given a double Allocation vote in the same execution', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody1 = getValidMessageBody('Allocation');
    // add the first signature entree again
    messageBody1.dict[0][1].dict.push(messageBody1.dict[0][1].dict[0]);
    await addDemoData({
      blockchainParser,
    });

    await Promise.all([
      addExecution({
        blockNumber: 96,
        txIndex: 0,
        execution: getDemoExecution({ command: 'Allocation', messageBody: messageBody1 }),
      }),
    ]);
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    const numOfEmptyVotes = votes.reduce(
      (count, cur) => (cur.address === null ? count + 1 : count),
      0
    );
    t.assert(
      result === 2 && votes.length === 2 && numOfEmptyVotes === 0,
      `${given}: should only add the valid votes`
    );
    after();
  });
};
