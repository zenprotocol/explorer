'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const executionsData = require('./test/data/executions.json');

const CONTRACT_ID = 'test-contract-id';

let votesAdder;
let votesDAL;

function before({ contractId = CONTRACT_ID } = {}) {
  votesDAL = td.replace('../../../server/components/api/votes/votesDAL.js', {
    findAllUnprocessedExecutions: td.func('findAllUnprocessedExecutions'),
    bulkCreate: td.func('bulkCreate')
  });

  const db = td.replace('../../../server/db/sequelize/models/index.js', {
    sequelize: td.object(['transaction']),
    Sequelize: td.object()
  });
  td.when(db.sequelize.transaction()).thenResolve({ commit() {} });

  const VotesAdder = require('./RepoVotesAdder');
  const BlockchainParser = require('../../../server/lib/BlockchainParser');
  votesAdder = new VotesAdder({
    blockchainParser: new BlockchainParser(),
    contractId
  }); // chain = main
  td.replace(votesAdder, 'verify');
  td.replace(votesAdder, 'validateIntervalAndCandidates');
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
          string: '1234512345123451234512345123451234512345'
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668'
              }
            ]
          ]
        }
      ]
    });
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('unknown extra data', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      list: [
        {
          string: 'unknown'
        },
        {
          string: '1234512345123451234512345123451234512345'
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668'
              }
            ]
          ]
        }
      ]
    });
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('no commit id', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      list: [
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668'
              }
            ]
          ]
        }
      ]
    });
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('no dict', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      list: [
        {
          string: '1234512345123451234512345123451234512345'
        }
      ]
    });
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('Valid message body', async given => {
    before();
    const result = votesAdder.validateMessageBody({
      list: [
        {
          string: '1234512345123451234512345123451234512345'
        },
        {
          dict: [
            [
              '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
              {
                signature:
                  '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668'
              }
            ]
          ]
        }
      ]
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
          '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668'
      }
    ]);
    t.equals(result, false, `${given}: Should return false`);
    after();
  });

  await wrapTest('no signature', async given => {
    before();
    t.equals(
      votesAdder.validateDictElement([
        '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92'
      ]),
      false,
      `${given}: Should return false`
    );
    t.equals(
      votesAdder.validateDictElement([
        '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
        '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668'
      ]),
      false,
      `${given}: Should return false if signature is not an object`
    );
    t.equals(
      votesAdder.validateDictElement([
        '029ae9b49e60259958302fab6c9be333775fd7ada72f11643218dcf23e5f37ec92',
        {
          wrong:
            '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668'
        }
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
          '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668'
      }
    ]);
    t.equals(result, true, `${given}: Should return true`);
    after();
  });
});

test('VotesAdder.doJob()', async function(t) {
  function stub({ executions = executionsData } = {}) {
    td.when(
      votesDAL.findAllUnprocessedExecutions(td.matchers.anything())
    ).thenResolve(executions);
    td.when(votesAdder.verify(td.matchers.anything())).thenResolve(true);
  }

  await wrapTest('No contract id', async given => {
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
});

async function wrapTest(given, test) {
  await test(given);

  td.reset();
}