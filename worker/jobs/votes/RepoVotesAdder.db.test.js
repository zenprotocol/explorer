'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const { PublicKey } = require('@zen/zenjs');
const truncate = require('../../../test/lib/truncate');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const executionsDAL = require('../../../server/components/api/executions/executionsDAL');
const txsDAL = require('../../../server/components/api/txs/txsDAL');
const outputsDAL = require('../../../server/components/api/outputs/outputsDAL');
const voteIntervalsDAL = require('../../../server/components/api/repovote-intervals/repoVoteIntervalsDAL');
const repoVotesDAL = require('../../../server/components/api/repovotes/repoVotesDAL');
const SnapshotsTaker = require('../snapshots/SnapshotsTaker');
const createDemoBlocksFromTo = require('../../../test/lib/createDemoBlocksFromTo');
const faker = require('faker');
const BlockchainParser = require('../../../server/lib/BlockchainParser');
const RepoVotesAdder = require('./RepoVotesAdder');
const executionsData = require('./test/data/executions.json');
const votesDAL = require('../../../server/components/api/repovotes/repoVotesDAL');

const CONTRACT_ID = 'test-contract-id';
const DEFAULT_COMMIT_ID = '0000000000000000000000000000000000000000';
const SNAPSHOT_BLOCK_CONTESTANT = 5;
const TALLY_BLOCK_CONTESTANT = 10;
const SNAPSHOT_BLOCK_CANDIDATE = 15;
const TALLY_BLOCK_CANDIDATE = 20;
const ADDRESS_AMOUNTS = {
  tzn1qnw2cxku67eaacdzupt58nwf6trg087g8snyc9gk62taaw8v8qz3sy7v0d9: '100' + '00000000' + '000000',
  tzn1qxp6ekp72q8903efylsnej34pa940cd2xae03l49pe7hkg3mrc26qyh2rgr: '101' + '00000000' + '000000',
};

test.onFinish(() => {
  executionsDAL.db.sequelize.close();
});

test('VotesAdder.doJob() (DB)', async function (t) {
  await wrapTest('Given no contract executions', async (given) => {
    const votesAdder = new RepoVotesAdder({
      blockchainParser: new BlockchainParser(),
      contractId: CONTRACT_ID,
      defaultCommitId: DEFAULT_COMMIT_ID,
    });
    before(votesAdder);
    const result = await votesAdder.doJob();
    t.equal(result, 0, `${given}: should not add any votes`);
    after();
  });

  await wrapTest('Given contestant phase', async (given) => {
    const votesAdder = new RepoVotesAdder({
      blockchainParser: new BlockchainParser(),
      contractId: CONTRACT_ID,
      defaultCommitId: DEFAULT_COMMIT_ID,
    });
    before(votesAdder);
    await createDemoData();

    // add demo executions
    await Promise.all(
      executionsData.map((execution) => {
        return (async () => {
          const tx = await txsDAL.create({
            blockNumber: 6,
            index: 0,
            version: 0,
            inputCount: 1,
            outputCount: 1,
            hash: faker.random.uuid(),
          });
          await executionsDAL.create({
            contractId: CONTRACT_ID,
            blockNumber: 6,
            txId: tx.id,
            command: '',
            messageBody: JSON.stringify(execution.messageBody),
          });
        })();
      })
    );
    const result = await votesAdder.doJob();
    t.equal(result, 15, `${given}: should add all votes`);
    const votes = await repoVotesDAL.findAll();
    t.assert(
      votes.every((v) => v.blockNumber > 0 && v.txHash.length > 0),
      `${given}: all votes should have blockNumber and txHash`
    );
    after();
  });

  await wrapTest('Given contestant phase, some votes outside of range', async (given) => {
    const votesAdder = new RepoVotesAdder({
      blockchainParser: new BlockchainParser('test'),
      contractId: CONTRACT_ID,
      defaultCommitId: DEFAULT_COMMIT_ID,
    });
    before(votesAdder);
    await createDemoData();

    const [, address2] = await Promise.all([
      insertExecution({
        blockNumber: 2,
        commitId: '1',
        pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
      }),
      insertExecution({
        blockNumber: 6,
        commitId: '2',
        pk: '038a20015c9309fb623ee2c9fee2cfb22d6a0fc89e437a8926733b15efd13b1556',
      }),
    ]);

    const result = await votesAdder.doJob();
    const votesOutsideRange = await repoVotesDAL.findAll({ where: { commitId: '1' } });
    const validVotes = await repoVotesDAL.findAll({ where: { address: address2 } });
    t.equal(result, 2, `${given}: should add valid votes and 1 vote per invalid`);
    t.equal(votesOutsideRange.length, 0, `${given}: should not have outside range votes in db`);
    t.equal(validVotes.length, 1, `${given}: should insert the valid vote`);
    after();
  });

  await wrapTest('Given candidate phase, no candidates', async (given) => {
    const votesAdder = new RepoVotesAdder({
      blockchainParser: new BlockchainParser('test'),
      contractId: CONTRACT_ID,
      defaultCommitId: DEFAULT_COMMIT_ID,
    });
    before(votesAdder);
    await createDemoData();

    await insertExecution({
      blockNumber: 16,
      commitId: '1',
      pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
    });

    const result = await votesAdder.doJob();
    const votes = await repoVotesDAL.findAll();
    t.equal(result, 1, `${given}: should return 1 for an empty vote`);
    t.equal(votes.length, 1, `${given}: should add a vote`);
    t.equal(votes[0].address, null, `${given}: should add an empty vote`);

    after();
  });

  await wrapTest('Given candidate phase, with candidates, votes are for other', async (given) => {
    const votesAdder = new RepoVotesAdder({
      blockchainParser: new BlockchainParser('test'),
      contractId: CONTRACT_ID,
      defaultCommitId: DEFAULT_COMMIT_ID,
    });
    before(votesAdder);
    await createDemoData();

    // add a valid candidate
    await addVote({
      address: 'tzn1qnw2cxku67eaacdzupt58nwf6trg087g8snyc9gk62taaw8v8qz3sy7v0d9',
      blockNumber: 6,
      commitId: '2',
    });

    // add a execution with a vote for another commit id
    await insertExecution({
      blockNumber: 16,
      commitId: '1',
      pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
    });

    const result = await votesAdder.doJob();
    const votes = await repoVotesDAL.findAll({ where: { commitId: '1' } });
    t.equal(result, 1, `${given}: should return 1`);
    t.equal(votes.length, 0, `${given}: should not add a vote for a non candidate`);
    after();
  });

  await wrapTest('Given candidate phase, with candidates, votes for candidate', async (given) => {
    const votesAdder = new RepoVotesAdder({
      blockchainParser: new BlockchainParser('test'),
      contractId: CONTRACT_ID,
      defaultCommitId: DEFAULT_COMMIT_ID,
    });
    before(votesAdder);
    await createDemoData();

    // add a valid candidate
    await addVote({
      address: 'tzn1qnw2cxku67eaacdzupt58nwf6trg087g8snyc9gk62taaw8v8qz3sy7v0d9',
      blockNumber: 6,
      commitId: '1',
    });

    // add a execution with a vote for another commit id
    const address = await insertExecution({
      blockNumber: 16,
      commitId: '1',
      pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
    });

    const result = await votesAdder.doJob();
    const votesBlock16 = await votesDAL.findAll({
      where: {
        blockNumber: 16,
      },
    });
    t.equal(result, 1, `${given}: should return 2 for a valid vote for 2 addresses`);
    t.equal(votesBlock16.length, 1, `${given}: should have 1 vote in block 16`);
    t.equal(votesBlock16[0].address, address, `${given}: the valid vote should have the address`);
    after();
  });

  await wrapTest(
    'Given candidate phase, no candidates, votes for default commit id',
    async (given) => {
      const votesAdder = new RepoVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        contractId: CONTRACT_ID,
        defaultCommitId: DEFAULT_COMMIT_ID,
      });
      before(votesAdder);
      await createDemoData();

      // add a execution with a vote for the default
      const address = await insertExecution({
        blockNumber: 16,
        commitId: DEFAULT_COMMIT_ID,
        pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
      });

      const result = await votesAdder.doJob();
      const votesBlock16 = await votesDAL.findAll({
        where: {
          blockNumber: 16,
        },
      });
      t.equal(result, 1, `${given}: should return 1`);
      t.equal(votesBlock16.length, 1, `${given}: should have 1 vote in block 16`);
      t.equal(votesBlock16[0].address, address, `${given}: the valid vote should have the address`);
      after();
    }
  );

  await wrapTest(
    'Given contestant phase with double votes in different blocks, 1st already in db',
    async (given) => {
      const votesAdder = new RepoVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        contractId: CONTRACT_ID,
        defaultCommitId: DEFAULT_COMMIT_ID,
      });
      before(votesAdder);
      await createDemoData();

      const person = {
        pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
        address: 'tzn1qvzktnry4tlyrdf9lutdvaxrya43zq6pt5wyzrepp6fgwpqe7cflqctenwd',
      };

      await addVote({
        address: person.address,
        blockNumber: 6,
        commitId: '2',
      });

      // double vote
      await insertExecution({
        blockNumber: 7,
        commitId: '3',
        pk: person.pk,
      });

      const result = await votesAdder.doJob();
      t.equal(result, 1, `${given}: should add all votes`);
      const doubleVotes = await repoVotesDAL.findAll({ where: { commitId: '3' } });
      t.equal(doubleVotes.length, 0, `${given}: should not insert double votes`);
      after();
    }
  );

  await wrapTest(
    'Given contestant phase with double votes in same blocks, 1st already in db',
    async (given) => {
      const votesAdder = new RepoVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        contractId: CONTRACT_ID,
        defaultCommitId: DEFAULT_COMMIT_ID,
      });
      before(votesAdder);
      await createDemoData();

      const person = {
        pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
        address: 'tzn1qvzktnry4tlyrdf9lutdvaxrya43zq6pt5wyzrepp6fgwpqe7cflqctenwd',
      };

      await addVote({
        address: person.address,
        blockNumber: 6,
        commitId: '2',
      });

      // double vote
      await insertExecution({
        blockNumber: 6,
        commitId: '3',
        pk: person.pk,
      });

      const result = await votesAdder.doJob();
      t.equal(result, 1, `${given}: should add all votes`);
      const doubleVotes = await repoVotesDAL.findAll({ where: { commitId: '3' } });
      t.equal(doubleVotes.length, 0, `${given}: should not insert double votes`);
      after();
    }
  );

  await wrapTest(
    'Given contestant phase with double votes in different blocks, all in same batch',
    async (given) => {
      const votesAdder = new RepoVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        contractId: CONTRACT_ID,
        defaultCommitId: DEFAULT_COMMIT_ID,
      });
      before(votesAdder);
      await createDemoData();

      const person = {
        pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
        address: 'tzn1qvzktnry4tlyrdf9lutdvaxrya43zq6pt5wyzrepp6fgwpqe7cflqctenwd',
      };

      await Promise.all([
        insertExecution({
          blockNumber: 6,
          commitId: '2',
          pk: person.pk,
        }),
        // double vote
        insertExecution({
          blockNumber: 7,
          commitId: '3',
          pk: person.pk,
        }),
        // another double vote
        insertExecution({
          blockNumber: 8,
          commitId: '4',
          pk: person.pk,
        }),
      ]);

      const result = await votesAdder.doJob();
      t.equal(result, 3, `${given}: should add all votes`);
      const doubleVotes = await repoVotesDAL.findAll({ where: { commitId: '3' } });
      t.equal(doubleVotes.length, 0, `${given}: should not insert double votes`);
      after();
    }
  );

  await wrapTest(
    'Given contestant phase with double votes in same blocks, all in same batch',
    async (given) => {
      const votesAdder = new RepoVotesAdder({
        blockchainParser: new BlockchainParser('test'),
        contractId: CONTRACT_ID,
        defaultCommitId: DEFAULT_COMMIT_ID,
      });
      before(votesAdder);
      await createDemoData();

      const person = {
        pk: '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c',
        address: 'tzn1qvzktnry4tlyrdf9lutdvaxrya43zq6pt5wyzrepp6fgwpqe7cflqctenwd',
      };

      await Promise.all([
        insertExecution({
          blockNumber: 6,
          commitId: '2',
          pk: person.pk,
          txIndex: 0,
        }),
        // double vote
        insertExecution({
          blockNumber: 6,
          commitId: '3',
          pk: person.pk,
          txIndex: 1,
        }),
        // another double vote
        insertExecution({
          blockNumber: 6,
          commitId: '4',
          pk: person.pk,
          txIndex: 2,
        }),
      ]);

      const result = await votesAdder.doJob();
      t.equal(result, 3, `${given}: should add all votes`);
      const doubleVotes = await repoVotesDAL.findAll({ where: { commitId: '3' } });
      t.equal(doubleVotes.length, 0, `${given}: should not insert double votes`);
      after();
    }
  );
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

function before(votesAdder) {
  td.replace(votesAdder, 'verify');
  td.when(votesAdder.verify(td.matchers.anything())).thenReturn(true);
}
function after() {
  td.reset();
}

/**
 * Creates a range of blocks, some addresses with amount, an interval and take a snapshot
 */
async function createDemoData() {
  // create a range of blocks
  await createDemoBlocksFromTo(1, TALLY_BLOCK_CANDIDATE);
  // add amount to some addresses all in block 1
  for (let i = 0; i < Object.keys(ADDRESS_AMOUNTS).length; i++) {
    const address = Object.keys(ADDRESS_AMOUNTS)[i];
    const amount = ADDRESS_AMOUNTS[address];
    const tx = await txsDAL.create({
      blockNumber: 1,
      index: i,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount,
      index: 0,
    });
  }

  // add the voting contract
  await contractsDAL.create({
    id: CONTRACT_ID,
    address: 'ctzn1qqqqqqq8rzylch7w03dmym9zad7vuvs4akp5azdaa6hm7gnc7wk287k9qgssqskgv',
    code: '',
    expiryBlock: 1000,
  });

  // add the intervals
  const contestant = await voteIntervalsDAL.create({
    interval: 1,
    phase: 'Contestant',
    beginBlock: SNAPSHOT_BLOCK_CONTESTANT,
    endBlock: TALLY_BLOCK_CONTESTANT,
    thresholdZp: 1000000,
  });
  await voteIntervalsDAL.create({
    interval: 1,
    phase: 'Candidate',
    beginBlock: SNAPSHOT_BLOCK_CANDIDATE,
    endBlock: TALLY_BLOCK_CANDIDATE,
    prevPhaseId: contestant.id,
  });

  const snapshotsTaker = new SnapshotsTaker({ chain: 'test' });
  await snapshotsTaker.doJob();
}

/**
 * Insert a tx and an execution to a specific block, containing a vote
 *
 * @param {*} [{blockNumber, interval, phase, commitId}={}]
 * @returns the address of the given pk
 */
async function insertExecution({ blockNumber, commitId, pk, txIndex = 0 } = {}) {
  // add a tx
  const tx = await txsDAL.create({
    blockNumber,
    index: txIndex,
    version: 0,
    inputCount: 1,
    outputCount: 1,
    hash: faker.random.uuid(),
  });
  await executionsDAL.create({
    blockNumber,
    txId: tx.id,
    contractId: CONTRACT_ID,
    command: '',
    messageBody: JSON.stringify(getMessageBody({ commitId, pk })),
  });

  return PublicKey.fromString(pk).toAddress('test');
}

/**
 * Insert a vote to RepoVotes
 */
async function addVote({ address, commitId, blockNumber } = {}) {
  const contract = await contractsDAL.findById(CONTRACT_ID);
  const tx = await txsDAL.create({
    blockNumber,
    index: 0,
    version: 0,
    inputCount: 0,
    outputCount: 1,
    hash: faker.random.uuid(),
  });
  const execution = await executionsDAL.create({
    blockNumber,
    txId: tx.id,
    contractId: contract.id,
    command: '',
    messageBody: JSON.stringify({}),
    indexInTx: 0,
  });

  await repoVotesDAL.create({
    blockNumber,
    executionId: execution.id,
    txHash: tx.hash,
    commitId,
    address,
  });
}

function getMessageBody({ commitId, pk } = {}) {
  return {
    list: [
      {
        string: commitId,
      },
      {
        dict: [
          [
            pk,
            {
              signature:
                '366a87c63e0aadedfb497b2a7dcb6d4841811e0e6b54b4dd6982207cc6f4a309ee862a0b0c80a15c8cec4f905bf7b03fb2959d38f92cf8a95af64af6f10f5668',
            },
          ],
        ],
      },
    ],
  };
}
