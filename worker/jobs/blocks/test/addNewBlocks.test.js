'use strict';

const test = require('blue-tape');
const Service = require('../../../../server/lib/Service');
const truncate = require('../../../../test/lib/truncate');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../../server/components/api/transactions/transactionsDAL');
const inputsDAL = require('../../../../server/components/api/inputs/inputsDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const BlockchainParser = require('../../../../server/lib/BlockchainParser');
const mock = require('./mock');
const BlocksAdder = require('../BlocksAdder');
const Config = require('../../../../server/config/Config');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

test('BlocksAdder.addNewBlocks()', async function(t) {
  await wrapTest('Given nothing in db', async given => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper);
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    try {
      const { count, latest } = await blocksAdder.addNewBlocks({
        data: { limitBlocks: 2, skipTransactions: true },
      });

      t.assert(count > 0, `${given}: Should have added new blocks`);
      t.equal(latest, 2, `${given}: Should return the latest block added`);

      const block1 = await blocksDAL.findByBlockNumber(1);
      t.assert(block1 !== null, `${given}: Block 1 should be in the db`);
      t.equal(
        block1.reward,
        '0',
        `${given}: Block 1 should have reward = 0`
      );

      const block2 = await blocksDAL.findByBlockNumber(2);
      t.assert(block2 !== null, `${given}: Block 2 should be in the db`);
      t.equal(
        block2.reward,
        '5000000000',
        `${given}: Block 2 should have a reward`
      );
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });

  await wrapTest('Given some already in DB', async given => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper);
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    // add demo first block in DB
    await blocksDAL.create({
      version: 0,
      hash: 'cb746bfdbc472602064dbc04e66326a8edf11a3c64d08ddfa90257e86e866b0f',
      parent: '0000000000000000000000000000000000000000000000000000000000000000',
      blockNumber: 1,
      commitments: 'test commitments',
      timestamp: 123456789,
      difficulty: 486539008,
      nonce1: -8412464686019857620,
      nonce2: 25078183,
    });

    try {
      const { count, latest } = await blocksAdder.addNewBlocks({
        data: { limitBlocks: 1, skipTransactions: true },
      });

      t.assert(count > 0, `${given}: Should have added new blocks`);
      t.equal(latest, 2, `${given}: Should return the latest block added`);

      const latestBlockAfterAdd = await blocksDAL.findLatest();
      t.equals(latestBlockAfterAdd.blockNumber, 2, `${given}: The latest block number should be 2`);
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest('Given network error when getting blocks info from node', async given => {
    const networkHelper = new NetworkHelper();
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    // mute the service to get empty responses
    Service.config.setBaseUrl('http://wrong.address.io');
    Service.config.setTimeout(1);
    
    try {
      await blocksAdder.addNewBlocks({ data: { limitBlocks: 1 } });
      t.fail(`${given}: Should throw an error`);
    } catch (error) {
      t.pass(`${given}: Should throw an error`);
    }

    Service.config.setBaseUrl(Config.get('zp:node'));
    Service.config.setTimeout(0);
  });
  await wrapTest('Given new blocks with transactions', async given => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper);
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    try {
      const { count } = await blocksAdder.addNewBlocks({
        data: { limitBlocks: 2, limitTransactions: 2 },
      });

      t.assert(count > 0, `${given}: Should have added new blocks`);

      const latestBlockAfterAdd = await blocksDAL.findLatest();
      t.assert(latestBlockAfterAdd !== null, `${given}: There should be new blocks in the db`);
      const transactions = await transactionsDAL.findAll({
        where: {
          BlockId: latestBlockAfterAdd.id,
        },
      });
      t.assert(transactions.length > 0, `${given}: There should be transactions for this block`);
    } catch (error) {
      t.fail(`${given}: Should not throw an error`);
    }
  });
  await wrapTest('Given new blocks with a falsy transaction', async given => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { falsyTransaction: true });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    try {
      await blocksAdder.addNewBlocks({
        data: { limitBlocks: 1, limitTransactions: 2 },
      });
      t.fail(`${given}: Should throw an error`);
    } catch (error) {
      const blocks = await blocksDAL.findAll();
      t.assert(blocks.length === 0, `${given}: Should not have added the block to the db`);
    }
  });
  await wrapTest('Given a transaction with a falsy output', async given => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { falsyOutput: true });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    try {
      await blocksAdder.addNewBlocks({
        data: { limitBlocks: 1, limitTransactions: 2 },
      });
      t.fail(`${given}: Should throw an error`);
    } catch (error) {
      const blocks = await blocksDAL.findAll();
      t.assert(blocks.length === 0, `${given}: Should not have added the block to the db`);
    }
  });
  await wrapTest('Given a transaction with a falsy input', async given => {
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { falsyInput: true });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    try {
      await blocksAdder.addNewBlocks({
        data: { limitBlocks: 1, limitTransactions: 2 },
      });
      t.fail(`${given}: Should throw an error`);
    } catch (error) {
      const blocks = await blocksDAL.findAll();
      t.assert(blocks.length === 0, `${given}: Should not have added the block to the db`);
    }
  });
  await wrapTest('Given a transaction with an outpoint input', async given => {
    const TEST_BLOCK_NUMBER = 86;
    const OUTPOINT_BLOCK_NUMBER = 1;
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: TEST_BLOCK_NUMBER });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    try {
      // add 1st block as the tested input references this
      await blocksAdder.addNewBlocks({
        data: { limitBlocks: 1 },
      });
      await createDemoBlocksFromTo(
        2,
        TEST_BLOCK_NUMBER - 1,
        '0000000001286157818c62beede85613a0293c66abe795a2397b6487e72d29d0'
      );
      // this is the tested block with an outpoint input
      await blocksAdder.addNewBlocks({
        data: { limitBlocks: 1 },
      });

      const inputs = await inputsDAL.findAll({
        where: {
          isMint: false,
        },
        limit: 1,
      });
      t.assert(inputs.length > 0, `${given}: There should be at least one outpoint input in db`);
      const input = inputs[0];
      t.assert(input.OutputId > 0, `${given}: OutputId should be set on this input`);
      const block = await (await (await input.getOutput()).getTransaction()).getBlock();
      t.equals(
        block.blockNumber,
        OUTPOINT_BLOCK_NUMBER,
        `${given}: The input tested should have its outpoint pointing to block 1`
      );
    } catch (error) {
      console.log(error);
      t.fail(`${given}: should not throw an error`);
    }
  });
  await wrapTest('Given a transaction with a mint input', async given => {
    const TEST_BLOCK_NUMBER = 176;
    const networkHelper = new NetworkHelper();
    mock.mockNetworkHelper(networkHelper, { latestBlockNumber: TEST_BLOCK_NUMBER });
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    try {
      await createDemoBlocksFromTo(
        1,
        TEST_BLOCK_NUMBER - 1,
        '00000000000fad5999c26f7d37331082f6558ff8f809cdf0845c071af2bff7e2'
      );
      await blocksAdder.addNewBlocks({
        data: { limitBlocks: 1 },
      });

      const inputs = await inputsDAL.findAll({
        where: {
          isMint: true,
        },
        limit: 1,
      });
      t.assert(inputs.length > 0, `${given}: There should be at least one mint input in db`);
      t.assert(
        typeof inputs[0].asset === 'string' && inputs[0].asset.length > 0,
        `${given}: Asset should be set`
      );
      t.assert(
        typeof inputs[0].amount === 'string' && Number(inputs[0].amount) > 0,
        `${given}: Amount should be set`
      );
    } catch (error) {
      t.fail(`${given}: should not throw an error`);
    }
  });
  await wrapTest(
    'Given a node block with parent not equal to last block hash in db',
    async given => {
      const TEST_BLOCK_NUMBER = 4;
      const networkHelper = new NetworkHelper();
      mock.mockNetworkHelper(networkHelper, { latestBlockNumber: TEST_BLOCK_NUMBER });
      const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

      try {
        await createDemoBlocksFromTo(
          1,
          TEST_BLOCK_NUMBER - 1,
          '12345' // last hash would be wrong! - reorg
        );
        await blocksAdder.addNewBlocks({
          data: { limitBlocks: 1 },
        });

        t.fail(`${given}: Should throw an error`);
      } catch (error) {
        t.equal(error.message, 'Reorg', `${given}: Should throw a Reorg error`);
      }
    }
  );
});

if (Config.get('RUN_REAL_DATA_TESTS')) {
  test('Add New Blocks with real data from node (NO MOCK)', async function(t) {
    await truncate();
    const networkHelper = new NetworkHelper();
    const blocksAdder = new BlocksAdder(networkHelper, new BlockchainParser());

    try {
      const { count } = await blocksAdder.addNewBlocks({ data: { limitBlocks: 200 } });
      t.assert(count > 0, 'Should have added new blocks');

      const latestBlockAfterAdd = await blocksDAL.findLatest();
      t.assert(latestBlockAfterAdd !== null, 'There should be new blocks in the db');
    } catch (error) {
      console.log('An error had occurred trying to get the chain info! check the node status!!!');
      t.fail('Should not throw an error');
    }
  });
}
