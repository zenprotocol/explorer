const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const CGPVotesAdder = require('../../../CGPVotesAdder');
const contractId = require('../modules/contractId');
const { addDemoData, addFundBalance } = require('../modules/addDemoData');
const getDemoCommand = require('../modules/getDemoCommand');
const getValidMessageBody = require('../modules/getValidMessageBody');
const getPayoutBallot = require('../modules/getPayoutBallot');

const blockchainParser = new BlockchainParser('test');

module.exports = async function part({ t, before, after }) {
  const testBallot = ({
    given,
    should,
    ballot,
    cgpFundBalance = [{ asset: '00', amount: 1000 * 100000000 }],
    assert = ({ votes }) => votes.length === 1 && votes[0].ballot === null,
  }) =>
    wrapTest(given, async () => {
      const cgpVotesAdder = new CGPVotesAdder({
        blockchainParser,
        chain: 'test',
        ...contractId,
      });
      before(cgpVotesAdder);
      const messageBody = getValidMessageBody('Nomination');
      // change the ballot
      messageBody.dict[0][1].string = ballot;
      await addDemoData({
        cgpFundZp: 0,
        blockchainParser,
        commands: [getDemoCommand({ command: 'Nomination', messageBody })],
      });
      await Promise.all(
        cgpFundBalance.map(({ asset, amount }) =>
          addFundBalance({
            blockchainParser,
            asset,
            amount,
          })
        )
      );
      await cgpVotesAdder.doJob();
      const votes = await cgpDAL.findAll();
      t.assert(assert({ votes }), `Given ${given}: should ${should}`);
      after();
    });

  await testBallot({
    given: 'a ballot with 1 spend that have amount=0',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [{ asset: '00', amount: 0 }],
    }),
  });
  await testBallot({
    given: 'a ballot with some spends with all amount=0',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [
        { asset: '00', amount: 0 },
        { asset: '00', amount: 0 },
      ],
    }),
  });
  await testBallot({
    given: 'a ballot with no spends',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [],
    }),
  });
  await testBallot({
    given: 'a ballot with 101 spends',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: new Array(101).fill('1').map((_, index) => {
        // make sure asset is valid and unique
        const templateIndex = `00${index}`;
        const s = templateIndex.substring(templateIndex.length - 3);
        return {
          asset: `000000000000000000000000000000000000000000000000000000000000000000000${s}`,
          amount: 1,
        };
      }),
    }),
  });

  await testBallot({
    given: 'fund has ZERO ZP',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [{ asset: '00', amount: 10 }],
    }),
    cgpFundBalance: [],
  });
  await testBallot({
    given: 'fund has less ZP',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [{ asset: '00', amount: 100000001 }],
    }),
    cgpFundBalance: [{ asset: '00', amount: 100000000 }],
  });
  await testBallot({
    given: 'when aggregating spends with same asset, fund has less ZP',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [
        { asset: '00', amount: 50000000 },
        { asset: '00', amount: 50000000 },
        { asset: '00', amount: 1 },
      ],
    }),
    cgpFundBalance: [{ asset: '00', amount: 100000000 }],
  });
  await testBallot({
    given: 'fund does not have one of the assets',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [
        { asset: '00', amount: 10000 },
        {
          asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
          amount: 100,
        },
      ],
    }),
  });
  await testBallot({
    given: 'one of the assets in the fund has less amount',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [
        { asset: '00', amount: 10000 },
        {
          asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
          amount: 100,
        },
      ],
    }),
    cgpFundBalance: [
      { asset: '00', amount: 10000 },
      {
        asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
        amount: 99,
      },
    ],
  });
  await testBallot({
    given: 'one of the assets in the fund has less amount across multiple spends',
    should: 'add an empty vote',
    ballot: getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [
        {
          asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
          amount: 50,
        },
        { asset: '00', amount: 10000 },
        {
          asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
          amount: 51,
        },
      ],
    }),
    cgpFundBalance: [
      { asset: '00', amount: 10000 },
      {
        asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
        amount: 100,
      },
    ],
  });
  await testBallot({
    given: 'vote for the cgp fund while it has no balance',
    should: 'add an empty vote',
    ballot: '020200eac6c58bed912ff310df9f6960e8ed5c28aac83b8a98964224bab1e06c779b9301000001',
    cgpFundBalance: [],
  });
  await testBallot({
    given: 'vote for the cgp fund while it has balance',
    should: 'add the vote',
    ballot: '020200eac6c58bed912ff310df9f6960e8ed5c28aac83b8a98964224bab1e06c779b9301000001',
    cgpFundBalance: [{ asset: '00', amount: 10000 }],
    assert: ({ votes }) =>
      votes.length &&
      votes[0].ballot ===
        '020200eac6c58bed912ff310df9f6960e8ed5c28aac83b8a98964224bab1e06c779b9301000001',
  });

  await (async () => {
    const ballot = getPayoutBallot({
      address: 'tzn1qx3xuxsls43ks682ade3c32wuf90lyv9k2pt9g40sgrz2h4t9c8fspj43mg',
      spends: [
        {
          asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
          amount: 50,
        },
        { asset: '00', amount: 10000 },
        {
          asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
          amount: 50,
        },
      ],
    });
    await testBallot({
      given: 'all assets in the fund have enough amount',
      should: 'add the vote',
      ballot,
      cgpFundBalance: [
        { asset: '00', amount: 10000 },
        {
          asset: '00000000d98d612ed6661219b80737c958fe036f88dd77d389e2aa3bf2daa33062cba723',
          amount: 100,
        },
      ],
      assert: ({ votes }) => votes.length === 2 && votes.every(vote => vote.ballot === ballot),
    });
  })();
};
