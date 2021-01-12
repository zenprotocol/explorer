const td = require('testdouble');
const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const cgpUtils = require('../../../../../../server/components/api/cgp/cgpUtils');
const CgpVotesAdder = require('../../../CgpVotesAdder');
const cgpAdderParams = require('../modules/cgpAdderParams');
const { addDemoData } = require('../modules/addDemoData');
const getDemoExecution = require('../modules/getDemoExecution');
const getValidMessageBody = require('../modules/getValidMessageBody');

const blockchainParser = new BlockchainParser('test');

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given an allocation vote with wrong interval', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before();
    td.replace(cgpVotesAdder, 'verifyIntervalHasSnapshot');
    td.replace(cgpVotesAdder, 'verifyAddressHadSnapshotBalance');
    td.when(cgpVotesAdder.verifyIntervalHasSnapshot(td.matchers.anything())).thenReturn(true);
    td.when(cgpVotesAdder.verifyAddressHadSnapshotBalance(td.matchers.anything())).thenReturn(true);

    await addDemoData({
      blockchainParser,
      executionsBlockNumber: 96,
      executions: [
        getDemoExecution({
          command: 'Allocation',
          messageBody: {
            // signed with the wrong interval
            dict: [
              [
                'Signature',
                {
                  dict: [
                    [
                      '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
                      {
                        signature:
                          '05dce7802c4dd909f362316d0c90adfca8ed3743af993c96b147854fa1bfb17e25bead07e9b083873504cf94e18bafbd3cd080d217b5dec28a253508fcd1e55c',
                      },
                    ],
                    [
                      '02b43a1cb4cb6472e1fcd71b237eb9c1378335cd200dd07536594348d9e450967e',
                      {
                        signature:
                          '0f69d10032f11a6ce861cfdfb8c54c339f9226b8476268d02478629807f11f03605ab1e8e2057abcc3ef60abba27ccbd37d22450d822bc205b3b57795336093e',
                      },
                    ],
                  ],
                },
              ],
              ['Allocation', { string: '010c' }],
            ],
          },
        }),
      ],
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 1 && votes.length === 1 && votes[0].ballot === null,
      `${given}: should add an empty vote`
    );
    after();
  });

  await wrapTest('Given an allocation vote with one bad signature', async (given) => {
    const cgpVotesAdder = new CgpVotesAdder({
      blockchainParser,
      chain: 'test',
      ...cgpAdderParams,
    });
    before();
    const messageBody = getValidMessageBody('Allocation');
    messageBody.dict[0][1].dict[0][1].signature = '496ac2e8a274534aec0ad8a';

    await addDemoData({
      blockchainParser,
      executionsBlockNumber: 96,
      executions: [
        getDemoExecution({
          command: 'Allocation',
          messageBody,
        }),
      ],
    });
    const result = await cgpVotesAdder.doJob();
    const votes = await cgpDAL.findAll();
    t.assert(
      result === 1 && votes.length === 1 && votes[0].ballot === null,
      `${given}: should add an empty vote`
    );
    after();
  });
};
