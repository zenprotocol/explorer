const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const CGPVotesAdder = require('../../../CGPVotesAdder');
const contractId = require('../modules/contractId');
const { addDemoData, addCommands } = require('../modules/addDemoData');
const getDemoCommand = require('../modules/getDemoCommand');
const getValidMessageBody = require('../modules/getValidMessageBody');
const getAllocationBallot = require('../modules/getAllocationBallot');
const allocationValues = require('../modules/allocationValues');

const blockchainParser = new BlockchainParser('test');

module.exports = async function part({ t, before, after }) {
  const getAllocationTest = ({ allocation, should, assert }) =>
    wrapTest(`Given allocation = ${allocation}%`, async given => {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser,
        chain: 'test',
        ...contractId,
      });
      before(cgpVotesAdder);

      const messageBody = getValidMessageBody('Allocation');
      messageBody.dict[1][1].string = getAllocationBallot(allocation);
      await addDemoData({
        blockchainParser,
        commandsBlockNumber: 96,
        commands: [
          getDemoCommand({
            command: 'Allocation',
            messageBody,
          }),
        ],
      });
      await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll();
      t.assert(assert({ votes }), `${given}: should ${should}`);
      after();
    });

  const addsEmptyVoteAssert = ({ votes }) => votes.length === 1 && votes[0].ballot === null;
  const addsTheVoteAssert = allocationKey => ({ votes }) =>
    votes.length === 2 &&
    votes[0].ballot === allocationValues[allocationKey].ballot &&
    votes[1].ballot === allocationValues[allocationKey].ballot;

  await getAllocationTest({
    allocation: allocationValues['91%'].allocation,
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });

  await getAllocationTest({
    allocation: allocationValues['5%'].allocation,
    should: 'add the vote',
    assert: addsTheVoteAssert('5%'),
  });

  const getAllocationTestWithPrevWinner = ({ prevAllocation, allocation, given, should, assert }) =>
    wrapTest(given, async () => {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser,
        chain: 'test',
        ...contractId,
      });
      before(cgpVotesAdder);

      const messageBodyPrevWinner = getValidMessageBody('Allocation');
      const messageBodyCurrent = getValidMessageBody('Allocation');
      messageBodyPrevWinner.dict[1][1].string = getAllocationBallot(prevAllocation);
      messageBodyCurrent.dict[1][1].string = getAllocationBallot(allocation);
      await addDemoData({ blockchainParser, lastBlockNumber: 200 });
      // add a command to block 96 (prev winner)
      await addCommands({
        commandsBlockNumber: 96,
        commands: [
          getDemoCommand({
            command: 'Allocation',
            messageBody: messageBodyPrevWinner,
          }),
        ],
      });
      // add a command to block 196 (current)
      await addCommands({
        commandsBlockNumber: 196,
        commands: [
          getDemoCommand({
            command: 'Allocation',
            messageBody: messageBodyCurrent,
          }),
        ],
      });

      await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll({
        include: [
          {
            model: cgpDAL.db.Command,
            required: true,
            include: [
              {
                model: cgpDAL.db.Transaction,
                required: true,
                include: [
                  {
                    model: cgpDAL.db.Block,
                    required: true,
                    where: {
                      blockNumber: {
                        [cgpDAL.db.Sequelize.Op.gt]: 190,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
      t.assert(assert({ votes }), `Given ${given}: should ${should}`);
      after();
    });

  await getAllocationTestWithPrevWinner({
    prevAllocation: allocationValues['5%'].allocation,
    allocation: allocationValues['5%'].allocation,
    given: 'prev allocation=5% (max is 19.25%) and allocation is 5%',
    should: 'add the vote',
    assert: addsTheVoteAssert('5%'),
  });

  await getAllocationTestWithPrevWinner({
    prevAllocation: allocationValues['5%'].allocation,
    allocation: allocationValues['30%'].allocation,
    given: 'prev allocation=5% (max is 19.25%) and allocation is 30%',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });

  await getAllocationTestWithPrevWinner({
    prevAllocation: allocationValues['5%'].allocation,
    allocation: allocationValues['18%'].allocation,
    given: 'prev allocation=5% (max is 19.25%) and allocation is 18%',
    should: 'add the vote',
    assert: addsTheVoteAssert('18%'),
  });

  await getAllocationTestWithPrevWinner({
    prevAllocation: allocationValues['5%'].allocation,
    allocation: allocationValues['20%'].allocation,
    given: 'prev allocation=5% (max is 19.25%) and allocation is 20%',
    should: 'add an empty vote',
    assert: addsEmptyVoteAssert,
  });

  const getAllocationTestWithPrevWinnerAfterGap = ({
    prevAllocation,
    allocation,
    given,
    should,
    assert,
  }) =>
    wrapTest(given, async () => {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser,
        chain: 'test',
        ...contractId,
      });
      before(cgpVotesAdder);

      const messageBodyPrevWinner = getValidMessageBody('Allocation');
      const messageBodyCurrent = getValidMessageBody('Allocation');
      messageBodyPrevWinner.dict[1][1].string = getAllocationBallot(prevAllocation);
      messageBodyCurrent.dict[1][1].string = getAllocationBallot(allocation);
      await addDemoData({ blockchainParser, lastBlockNumber: 300 });
      // (prev winner)
      await addCommands({
        commandsBlockNumber: 96,
        commands: [
          getDemoCommand({
            command: 'Allocation',
            messageBody: messageBodyPrevWinner,
          }),
        ],
      });
      // (current)
      await addCommands({
        commandsBlockNumber: 296,
        commands: [
          getDemoCommand({
            command: 'Allocation',
            messageBody: messageBodyCurrent,
          }),
        ],
      });

      await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll({
        include: [
          {
            model: cgpDAL.db.Command,
            required: true,
            include: [
              {
                model: cgpDAL.db.Transaction,
                required: true,
                include: [
                  {
                    model: cgpDAL.db.Block,
                    required: true,
                    where: {
                      blockNumber: {
                        [cgpDAL.db.Sequelize.Op.gt]: 290,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      });
      t.assert(assert({ votes }), `Given ${given}: should ${should}`);
      after();
    });

  await getAllocationTestWithPrevWinnerAfterGap({
    prevAllocation: allocationValues['5%'].allocation,
    allocation: allocationValues['18%'].allocation,
    given: 'prev allocation=5% (max is 19.25%), a gap with no votes and allocation is 18%',
    should: 'add the vote',
    assert: addsTheVoteAssert('18%'),
  });
};
