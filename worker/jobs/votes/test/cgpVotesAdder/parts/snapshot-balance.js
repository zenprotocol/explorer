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
// --- message bodies with addresses not in snapshot
const MESSAGE_BODY_PAYOUT = {
  dict: [
    [
      'Payout',
      {
        string: '0201bbe46c5b395c0b7c5fffbe84761ca966ef5c025525520e543d907f25b7b440c80100200c',
      },
    ],
    [
      'Signature',
      {
        dict: [
          [
            '02b6352639651e4728e48de4638ba21be9e5078b6d5474c10a5503559b92f8d662',
            {
              signature:
                '209425a665df3f35e36c05b1dc50d4b429509d1c77aa9f47f9998f2a9c08a812400d93cc74768496fb49a2ac36a972fb2e9e90f495aa1e14d9083b44e766c5b4',
            },
          ],
          [
            '037316dd44ef5fefcc60d7cd97c5726cf668e3d47596db5c417318a8ebe219e2b7',
            {
              signature:
                '42a631a135a5d29fa9efd6ebc013765ebbd19d8ee87a3d2bca1c5c46560650e611e8fef31a097e6db1e3ae799c47b9183b505d0073175a9c93a205efbd552707',
            },
          ],
        ],
      },
    ],
  ],
};
const MESSAGE_BODY_NOMINATION = {
  dict: [
    [
      'Nomination',
      {
        string: '0201f2677af8c95b86a104cb09b214bd4af9794b3edc876fdc2f13794acff366250f01002001',
      },
    ],
    [
      'Signature',
      {
        dict: [
          [
            '031275b4a2c5010cf0d7b6c83b128598bca125eafabed71207d8d3aef1e516e259',
            {
              signature:
                'c534e874f70d176724031a7c05662c28575732e5085b6ec7e70aac2617aaf0e1586c99bd990965fe6066a3d711ea6159961f09cf1843d5d928f1d290aa38b3c4',
            },
          ],
        ],
      },
    ],
  ],
};
const MESSAGE_BODY_ALLOCATION = {
  dict: [
    [
      'Signature',
      {
        dict: [
          [
            '02b6352639651e4728e48de4638ba21be9e5078b6d5474c10a5503559b92f8d662',
            {
              signature:
                '34400a1e0c14ae7c12a8750c925b3479f6691e69db625e690d0519a30b896e1569fe7941ca39073ad0376edd65723be08511c6aa8144605c3beeb1d4932c80bd',
            },
          ],
          [
            '037316dd44ef5fefcc60d7cd97c5726cf668e3d47596db5c417318a8ebe219e2b7',
            {
              signature:
                'ab180590b3e7930407195bb44ddf4bf03e023aa483a51746feac48894ecba8ca0b6a55867eb4e44b8d25e2575419122773b4a6e695c7c76204bd5f467c7c8b11',
            },
          ],
        ],
      },
    ],
    [
      'Allocation',
      {
        string: '0105',
      },
    ],
  ],
};

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given no snapshot yet', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = getValidMessageBody('Nomination');
    await addDemoData({
      executions: [getDemoExecution({ command: 'Nomination', messageBody })],
      executionsBlockNumber: 91,
      blockchainParser,
      takeSnapshot: false,
    });

    try {
      await cgpVotesAdder.doJob();
      t.fail('Should throw an error');
    } catch (error) {
      t.equal(error.message, 'No snapshot', `${given}: should throw a "No snapshot" error`);
    }
    after();
  });
  await wrapTest('Given nomination, address did not have balance at snapshot', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    const messageBody = MESSAGE_BODY_NOMINATION;
    await addDemoData({
      executions: [getDemoExecution({ command: 'Nomination', messageBody })],
      executionsBlockNumber: 91,
      blockchainParser,
      takeSnapshot: true,
    });

    await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(votes.length === 1 && votes[0].address === null, `${given}: should add an empty vote`);
    after();
  });
  await wrapTest('Given payout, address did not have balance at snapshot', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    // valid candidate
    const nominationMessageBody = getValidMessageBody('Nomination');
    const payoutMessageBody = MESSAGE_BODY_PAYOUT;
    // set to a valid candidate
    payoutMessageBody.dict[0][1].string = nominationMessageBody.dict[0][1].string;
    await addDemoData({
      blockchainParser,
      takeSnapshot: true,
    });
    await addExecutions({
      executionsBlockNumber: 91,
      executions: [getDemoExecution({ command: 'Nomination', messageBody: nominationMessageBody })],
    });
    await addExecutions({
      executionsBlockNumber: 97,
      executions: [getDemoExecution({ command: 'Payout', messageBody: payoutMessageBody })],
    });

    await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll({
      where: { blockNumber: { [cgpDAL.db.Sequelize.Op.gt]: 95 } },
    });
    t.assert(votes.length === 1 && votes[0].address === null, `${given}: should add an empty vote`);
    after();
  });
  await wrapTest('Given allocation, address did not have balance at snapshot', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before(cgpVotesAdder);
    await addDemoData({
      executionsBlockNumber: 97,
      executions: [getDemoExecution({ command: 'Allocation', messageBody: MESSAGE_BODY_ALLOCATION })],
      blockchainParser,
      takeSnapshot: true,
    });

    await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll({
      where: { blockNumber: { [cgpDAL.db.Sequelize.Op.gt]: 95 } },
    });
    t.assert(votes.length === 1 && votes[0].address === null, `${given}: should add an empty vote`);
    after();
  });
};
