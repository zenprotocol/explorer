'use strict';

const test = require('blue-tape');
const { Address } = require('@zen/zenjs');
const { ContractId } = require('@zen/zenjs/build/src/Consensus/Types/ContractId');
const truncate = require('../../../../test/lib/truncate');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../../server/components/api/transactions/transactionsDAL');
const outputsDAL = require('../../../../server/components/api/outputs/outputsDAL');
const contractsDAL = require('../../../../server/components/api/contracts/contractsDAL');
const commandsDAL = require('../../../../server/components/api/commands/commandsDAL');
const cgpDAL = require('../../../../server/components/api/cgp/cgpDAL');
const cgpIntervalDAL = require('../../../../server/components/api/cgp/cgpIntervalDAL');
const SnapshotsTaker = require('../../snapshots/SnapshotsTaker');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');
const faker = require('faker');
const CGPWinnerCalculator = require('./CGPWinnerCalculator');

const CONTRACT_ID = '00000000abbf8805a203197e4ad548e4eaa2b16f683c013e31d316f387ecf7adc65b3fb2';
const TALLY_BLOCK = 100;
const ADDRESS_AMOUNTS = {
  tzn11: 10000000000,
  tzn12: 10100000000,
  tzn13: 10200000000,
};

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('CGPWinnerCalculator.doJob() (DB)', async function(t) {
  await wrapTest('Given current block is less than coinbase maturity', async given => {
    await createDemoData({ toBlock: 109 });
    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0101' });

    const winnerCalculator = new CGPWinnerCalculator({ chain: 'test' });

    const result = await winnerCalculator.doJob();
    t.equal(result, 0, `${given}: should return 0`);
    const intervals = await cgpIntervalDAL.findAll();
    t.equal(intervals.length, 0, `${given}: should not create any intervals`);
  });
  await wrapTest('Given current block is equals to coinbase maturity', async given => {
    await createDemoData({ toBlock: 110 });
    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0101' });

    const winnerCalculator = new CGPWinnerCalculator({ chain: 'test' });

    const result = await winnerCalculator.doJob();
    t.equal(result, 1, `${given}: should return 1`);
    const intervals = await cgpIntervalDAL.findAll();
    t.equal(intervals.length, 1, `${given}: should create an interval`);
    t.assert(intervals[0].calculatedAtBlockId > 0, `${given}: interval should contain a block id`);
    const block = await blocksDAL.findOne({where: {id: intervals[0].calculatedAtBlockId}});
    t.equal(block.blockNumber, 110, `${given}: should be connected to the calculated at block`);
  });
  await wrapTest('Given current block is bigger than coinbase maturity', async given => {
    await createDemoData({ toBlock: 111 });
    await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0101' });

    const winnerCalculator = new CGPWinnerCalculator({ chain: 'test' });

    const result = await winnerCalculator.doJob();
    t.equal(result, 1, `${given}: should return 1`);
    const intervals = await cgpIntervalDAL.findAll();
    t.equal(intervals.length, 1, `${given}: should create an interval`);
  });
  await wrapTest(
    'Given current block is bigger than coinbase maturity but interval exists',
    async given => {
      await createDemoData({ toBlock: 111 });
      await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0101' });

      const block = await blocksDAL.findByBlockNumber(110);
      await cgpIntervalDAL.create({ interval: 1, calculatedAtBlockId: block.id });

      const winnerCalculator = new CGPWinnerCalculator({ chain: 'test' });

      const result = await winnerCalculator.doJob();
      t.equal(result, 0, `${given}: should return 0`);
      const intervals = await cgpIntervalDAL.findAll();
      t.equal(intervals.length, 1, `${given}: should not add a new interval`);
    }
  );
  await wrapTest(
    'Given current block is after 2nd interval and database empty',
    async given => {
      await createDemoData({ toBlock: 211 });
      await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0101' });
      await addVoteForAllAddresses({ blockNumber: 191, type: 'allocation', ballot: '0101' });

      const winnerCalculator = new CGPWinnerCalculator({ chain: 'test' });

      const result = await winnerCalculator.doJob();
      t.equal(result, 2, `${given}: should return 2`);
      const intervals = await cgpIntervalDAL.findAll();
      t.equal(intervals.length, 2, `${given}: should create the intervals`);
    }
  );
  await wrapTest(
    'Given current block is after 2nd interval and interval 1 exists',
    async given => {
      await createDemoData({ toBlock: 211 });
      await addVoteForAllAddresses({ blockNumber: 91, type: 'allocation', ballot: '0101' });
      await addVoteForAllAddresses({ blockNumber: 191, type: 'allocation', ballot: '0101' });
      const block = await blocksDAL.findByBlockNumber(110);
      await cgpIntervalDAL.create({ interval: 1, calculatedAtBlockId: block.id });

      const winnerCalculator = new CGPWinnerCalculator({ chain: 'test' });

      const result = await winnerCalculator.doJob();
      t.equal(result, 1, `${given}: should return 1`);
      const intervals = await cgpIntervalDAL.findAll();
      t.equal(intervals.length, 2, `${given}: should create one interval`);
      t.deepEqual(intervals.map(i => i.interval), [1, 2], `${given}: should have both intervals in the db`);
    }
  );
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

/**
 * Creates a range of blocks, some addresses with amount and take a snapshot
 */
async function createDemoData({ toBlock = TALLY_BLOCK } = {}) {
  // create a range of blocks
  await createDemoBlocksFromTo(1, toBlock);
  const block1 = await blocksDAL.findByBlockNumber(1);
  // add amount to some addresses all in block 1
  for (let i = 0; i < Object.keys(ADDRESS_AMOUNTS).length; i++) {
    const address = Object.keys(ADDRESS_AMOUNTS)[i];
    const amount = ADDRESS_AMOUNTS[address];
    const tx = await transactionsDAL.create({
      index: i,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount,
      index: 0,
    });

    await blocksDAL.addTransaction(block1, tx);
  }

  // add the voting contract
  await contractsDAL.create({
    id: CONTRACT_ID,
    address: Address.getPublicKeyHashAddress('test', ContractId.fromString(CONTRACT_ID)),
    code: '',
    expiryBlock: 1000,
  });

  const snapshotsTaker = new SnapshotsTaker({ chain: 'test' });
  await snapshotsTaker.doJob();
}

async function addVote({ address, ballot, type, blockNumber, txIndex = 0 } = {}) {
  const block = await blocksDAL.findByBlockNumber(blockNumber);
  const contract = await contractsDAL.findById(CONTRACT_ID);
  const tx = await transactionsDAL.create({
    BlockId: block.id,
    index: txIndex,
    version: 0,
    inputCount: 0,
    outputCount: 1,
    hash: faker.random.uuid(),
  });
  const command = await commandsDAL.create({
    TransactionId: tx.id,
    ContractId: contract.id,
    command: type == 'payout' ? 'Payout' : 'Allocation',
    messageBody: JSON.stringify({}),
    indexInTransaction: 0,
  });

  await cgpDAL.create({
    CommandId: command.id,
    address,
    ballot,
    type,
  });
}

async function addVoteForAllAddresses({ ballot, type, blockNumber } = {}) {
  for (let i = 0; i < Object.keys(ADDRESS_AMOUNTS).length; i++) {
    const address = Object.keys(ADDRESS_AMOUNTS)[i];
    await addVote({ address, blockNumber, ballot, type });
  }
}
