const wrapTest = require('../../../../../../test/lib/wrapTest');
const BlockchainParser = require('../../../../../../server/lib/BlockchainParser');
const cgpDAL = require('../../../../../../server/components/api/cgp/cgpDAL');
const CGPVotesAdder = require('../../../CGPVotesAdder');
const contractId = require('../modules/contractId');
const { addDemoData } = require('../modules/addDemoData');
const getDemoCommand = require('../modules/getDemoCommand');

const blockchainParser = new BlockchainParser('test');

module.exports = async function part({ t, before, after }) {
  await wrapTest('Given an allocation vote with wrong interval', async given => {
    const cgpVotesAdder = new CGPVotesAdder({
      blockchainParser,
      chain: 'test',
      ...contractId,
    });
    before();

    await addDemoData({
      blockchainParser,
      commands: [
        getDemoCommand({
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
};
