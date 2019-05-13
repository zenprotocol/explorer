'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const commandsData = require('./test/data/commands.json');

const CONTRACT_ID = 'test-contract-id';

let votesAdder;
let votesDAL;

function before({ contractId = CONTRACT_ID } = {}) {
  votesDAL = td.replace('../../../server/components/api/votes/votesDAL.js', {
    findAllUnprocessedCommands: td.func('findAllUnprocessedCommands'),
    bulkCreate: td.func('bulkCreate'),
  });

  const db = td.replace('../../../server/db/sequelize/models/index.js', {
    sequelize: td.object(['transaction']),
    Sequelize: td.object(),
  });
  td.when(db.sequelize.transaction()).thenResolve({ commit() {} });

  const VotesAdder = require('./VotesAdder');
  const BlockchainParser = require('../../../server/lib/BlockchainParser');
  votesAdder = new VotesAdder({
    blockchainParser: new BlockchainParser(),
    contractId,
  }); // chain = main
  td.replace(votesAdder, 'verify');
}
function after() {
  td.reset();
}

test('VotesAdder.validateMessageBody()', async function(t) {
  await wrapTest('Bad outer key', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      wrongKey: [
        {
          u32: 1,
        },
        {
          string: '1234512345123451234512345123451234512345',
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
              },
            ],
          ],
        },
      ],
    });
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('no interval', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      list: [
        {
          string: '1234512345123451234512345123451234512345',
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
              },
            ],
          ],
        },
      ],
    });
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('no commit id', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      list: [
        {
          u32: 1,
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
              },
            ],
          ],
        },
      ],
    });
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('no dict', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      list: [
        {
          u32: 1,
        },
        {
          string: '1234512345123451234512345123451234512345',
        },
      ],
    });
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('Valid message body', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      list: [
        {
          u32: 1,
        },
        {
          string: '1234512345123451234512345123451234512345',
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
              },
            ],
          ],
        },
      ],
    });
    t.equals(result, true, `${given}: Should return true`);
    after();
  });
});

test('VotesAdder.validateDictElement()', async function(t) {
  await wrapTest('no public key', async given => {
    before();
    const result = votesAdder.validateDictElement([
      {
        signature:
          '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
      },
    ]);
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('no signature', async given => {
    before();
    t.equals(
      votesAdder.validateDictElement([
        '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
      ]),
      false,
      `${given}: Should return false`
    );
    t.equals(
      votesAdder.validateDictElement([
        '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
        '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
      ]),
      false,
      `${given}: Should return false if signature is not an object`
    );
    t.equals(
      votesAdder.validateDictElement([
        '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
        {
          wrong:
            '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
        },
      ]),
      false,
      `${given}: Should return false if signature has a bad key`
    );
    after();
  });

  await wrapTest('Valid dict element', async given => {
    before();
    const result = votesAdder.validateDictElement([
      '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
      {
        signature:
          '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
      },
    ]);
    t.equals(result, true, `${given}: Should return true`);
    after();
  });
});

test('VotesAdder.processCommands()', async function(t) {
  const commands = [
    {
      id: '7',
      command: '',
      messageBody: {
        list: [
          {
            u32: 1,
          },
          {
            string: '1234512345123451234512345123451234512345',
          },
          {
            dict: [
              [
                '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
                {
                  signature:
                    '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
                },
              ],
              [
                '02b43a1cb4cb6472e1fcd71b237eb9c1378335cd200dd07536594348d9e450967e',
                {
                  signature:
                    '9bc1cb0b464ef334c9abfdaaea7808ba5145cf474e9ca0b6ecacd7687b92b1090a8fbee7066819c3f3ae8257902fffeb63b4cd4aa02d6a355db7bd87b99b7ce2',
                },
              ],
            ],
          },
        ],
      },
      TransactionId: '700',
      indexInTransaction: 0,
      ContractId: 'test-contract-id',
      createdAt: '2019-04-25T14:03:00.726Z',
      updatedAt: '2019-04-25T14:03:00.726Z',
    },
    {
      id: '8',
      command: '',
      messageBody: {
        list: [
          {
            u32: 1,
          },
          {
            string: '1234512345123451234512345123451234512345',
          },
          {
            dict: [
              [
                '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
                {
                  signature:
                    '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
                },
              ],
              [
                '02b43a1cb4cb6472e1fcd71b237eb9c1378335cd200dd07536594348d9e450967e',
                {
                  signature:
                    '9bc1cb0b464ef334c9abfdaaea7808ba5145cf474e9ca0b6ecacd7687b92b1090a8fbee7066819c3f3ae8257902fffeb63b4cd4aa02d6a355db7bd87b99b7ce2',
                },
              ],
            ],
          },
        ],
      },
      TransactionId: '800',
      indexInTransaction: 0,
      ContractId: 'test-contract-id',
      createdAt: '2019-04-25T14:03:00.726Z',
      updatedAt: '2019-04-25T14:03:00.726Z',
    },
  ];

  function stub({ valid = true } = {}) {
    td.when(votesAdder.verify(td.matchers.anything())).thenResolve(valid);
  }

  await wrapTest('Given 2 commands with 2 votes each', async given => {
    before();
    stub();
    const result = await votesAdder.processCommands(commands);
    t.assert(Array.isArray(result), `${given}: Should return an array`);
    t.equals(result.length, 4, `${given}: Should return 4 votes`);
    t.deepEquals(
      result.map(vote => vote.interval),
      [1, 1, 1, 1],
      `${given}: All votes should have interval`
    );
    after();
  });

  await wrapTest('Given all commands', async given => {
    before();
    stub();
    const result = await votesAdder.processCommands(commandsData);
    t.assert(Array.isArray(result), `${given}: Should return an array`);
    t.assert(result.length > 0, `${given}: Should return some votes`);
    after();
  });
});

test('VotesAdder.getVotesFromCommand()', async function(t) {
  const validCommand = {
    id: '8',
    command: '',
    messageBody: {
      list: [
        {
          u32: 1,
        },
        {
          string: '1234512345123451234512345123451234512345',
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
              },
            ],
            [
              '02b43a1cb4cb6472e1fcd71b237eb9c1378335cd200dd07536594348d9e450967e',
              {
                signature:
                  '9bc1cb0b464ef334c9abfdaaea7808ba5145cf474e9ca0b6ecacd7687b92b1090a8fbee7066819c3f3ae8257902fffeb63b4cd4aa02d6a355db7bd87b99b7ce2',
              },
            ],
          ],
        },
      ],
    },
    TransactionId: '800',
    indexInTransaction: 0,
    ContractId: 'test-contract-id',
    createdAt: '2019-04-25T14:03:00.726Z',
    updatedAt: '2019-04-25T14:03:00.726Z',
  };
  const invalidCommand = {
    id: '1',
    command: 'interval is missing',
    messageBody: {
      list: [
        {
          string: '1234512345123451234512345123451234512345',
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  'd0d01ed241f3ca624cfd987a6d0208fd44e758a9d21c007f09e89c5d2a74e290bed769f07b8f9c853b73445a0325f35278556c67fed68020d0b2b1767bb5d850',
              },
            ],
            [
              '02b43a1cb4cb6472e1fcd71b237eb9c1378335cd200dd07536594348d9e450967e',
              {
                signature:
                  'f379996a3977a41b7ac8822c80dcd4be09b1246967d52b5676d22a644e9e8c898e20674ecaa7164769d4cdd2fa13b5915d39a8f6da8c0fee08dc20984632f354',
              },
            ],
          ],
        },
      ],
    },
    TransactionId: '100',
    indexInTransaction: 0,
    ContractId: 'test-contract-id',
    createdAt: '2019-04-25T14:03:00.726Z',
    updatedAt: '2019-04-25T14:03:00.726Z',
  };

  function stub({ valid = true } = {}) {
    td.when(votesAdder.verify(td.matchers.anything())).thenResolve(valid);
  }

  await wrapTest('Return value', async given => {
    before();
    stub();
    const result = await votesAdder.getVotesFromCommand(validCommand);
    t.assert(Array.isArray(result), `${given}: Should return an array`);
    after();
  });

  await wrapTest('A command with 2 votes', async given => {
    before();
    stub();
    const result = await votesAdder.getVotesFromCommand(validCommand);
    t.equals(result.length, 2, `${given}: Should return an array with 2 elements`);
    const vote1 = result[0];
    t.equals(vote1.interval, 1, `${given}: Should contain the interval`);
    t.equals(vote1.CommandId, 8, `${given}: Should contain the CommandId`);
    t.equals(
      vote1.commitId,
      '1234512345123451234512345123451234512345',
      `${given}: Should contain the commitId`
    );
    after();
  });
  await wrapTest('An invalid command', async given => {
    before();
    stub();
    const result = await votesAdder.getVotesFromCommand(invalidCommand);
    t.equals(result.length, 1, `${given}: Should return an array with 1 element`);
    t.equals(
      result[0].CommandId,
      Number(invalidCommand.id),
      `${given}: The element should have the command id`
    );
    t.equals(result[0].interval, undefined, `${given}: Interval should be undefined`);
    after();
  });
});

test('VotesAdder.doJob()', async function(t) {
  function stub({ commands = commandsData } = {}) {
    td.when(votesDAL.findAllUnprocessedCommands(td.matchers.anything())).thenResolve(commands);
    td.when(votesAdder.verify(td.matchers.anything())).thenResolve(true);
  }

  await wrapTest('Default', async given => {
    before({ contractId: '' });
    stub();
    try {
      await votesAdder.doJob({});
      t.fail(`${given}: Should throw an error`);
    } catch (e) {
      t.pass(`${given}: Should throw an error`);
    }
    after();
  });

  await wrapTest('No contract id', async given => {
    before();
    stub();
    const result = await votesAdder.doJob({});
    t.assert(typeof result === 'number', `${given}: Should return a number`);
    after();
  });

  await wrapTest('No commands', async given => {
    before();
    stub({ commands: [] });
    const result = await votesAdder.doJob({});
    t.equals(result, 0, `${given}: Should return zero`);
    after();
  });

  await wrapTest('No votes in db', async given => {
    before();
    stub();
    const result = await votesAdder.doJob({});
    // there are 6 good commands in the stub, each have 2 addresses
    t.equals(result, 14, `${given}: Should add all valid commands`);
    try {
      td.verify(votesDAL.bulkCreate(td.matchers.anything(), td.matchers.anything()));
      t.pass(`${given}: should call votesDAL.bulkCreate`);
    } catch (error) {
      t.fail(`${given}: should call votesDAL.bulkCreate`);
    }
    after();
  });
});

async function wrapTest(given, test) {
  await test(given);

  td.reset();
}
