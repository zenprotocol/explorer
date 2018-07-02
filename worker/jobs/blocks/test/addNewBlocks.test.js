'use strict';

const test = require('blue-tape');
const Service = require('../../../../server/lib/Service');
const truncate = require('../../../../common/test/truncate');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../../server/components/api/transactions/transactionsDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const mock = require('./mock');
const block = require('./data/block');
const BlocksAdder = require('../BlocksAdder');
const Config = require('../../../../server/config/Config');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('Add New Blocks When 0 in DB', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper);
  const blocksAdder = new BlocksAdder(networkHelper);

  try {
    const numOfBlocksAdded = await blocksAdder.addNewBlocks({
      data: { limitBlocks: 1, skipTransactions: true },
    });

    t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');

    const latestBlocksAfterAdd = await blocksDAL.findLatest();
    t.assert(latestBlocksAfterAdd.length > 0, 'There should be new blocks in the db');
    t.equals(
      latestBlocksAfterAdd[0].blockNumber,
      1,
      'The block numbers should be equal'
    );
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }
});

test('Add New Blocks When some already in DB', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper);
  const blocksAdder = new BlocksAdder(networkHelper);

  // add demo first block in DB
  await blocksDAL.create({
    version: 0,
    parent: 'test parent',
    blockNumber: 1,
    commitments: 'test commitments',
    timestamp: 123456789,
    difficulty: 486539008,
    nonce1: -8412464686019857620,
    nonce2: 25078183,
  });

  // get latest block from api and save
  const latestBlocks = await blocksDAL.findLatest();
  t.equals(latestBlocks.length, 1, 'Latest blocks should have 1 element');

  try {
    const numOfBlocksAdded = await blocksAdder.addNewBlocks({
      data: { limitBlocks: 1, skipTransactions: true },
    });

    t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');

    const latestBlocksAfterAdd = await blocksDAL.findLatest();
    const latestBlockAfterAdd = latestBlocksAfterAdd[0];
    t.equals(
      latestBlockAfterAdd.blockNumber,
      2,
      'The block numbers should be equal'
    );

  } catch (error) {
    t.fail('Should not throw an error');
  }
});

test('Add New Blocks - Network error when getting blocks info from node', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  const blocksAdder = new BlocksAdder(networkHelper);

  // mute the service to get empty responses
  Service.config.setBaseUrl('http://1.1.1.1:8080');
  Service.config.setTimeout(500);
  try {
    await blocksAdder.addNewBlocks({ data: { limitBlocks: 1 } });
    t.fail('Should throw an error');
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }

  Service.config.setBaseUrl(Config.get('zp:node'));
  Service.config.setTimeout(0);
});

if (Config.get('RUN_REAL_DATA_TESTS')) {
  test('Add New Blocks with real data from node (NO MOCK)', async function(t) {
    await truncate();
    const networkHelper = new NetworkHelper();
    const blocksAdder = new BlocksAdder(networkHelper);
  
    try {
      const numOfBlocksAdded = await blocksAdder.addNewBlocks();
      t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');
  
      const latestBlocksAfterAdd = await blocksDAL.findLatest();
      t.assert(latestBlocksAfterAdd.length > 0, 'There should be new blocks in the db');
    } catch (error) {
      console.log('An error had occurred trying to get the chain info! check the node status!!!');
      t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
    }
  });
}

test('Add New Blocks with transactions', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper);
  const blocksAdder = new BlocksAdder(networkHelper);

  try {
    const numOfBlocksAdded = await blocksAdder.addNewBlocks({
      data: { limitBlocks: 1, limitTransactions: 2 },
    });

    t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');

    const latestBlocksAfterAdd = await blocksDAL.findLatest();
    t.assert(latestBlocksAfterAdd.length > 0, 'There should be new blocks in the db');
    const block = latestBlocksAfterAdd[0];
    const transactions = await transactionsDAL.findAll({
      where: {
        BlockId: block.id
      }
    });
    t.assert(transactions.length > 0, 'There should be transactions for this block');
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }
});

test('Add New Blocks with a falsy transaction', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper, {falsyTransaction: true});
  const blocksAdder = new BlocksAdder(networkHelper);

  try {
    await blocksAdder.addNewBlocks({
      data: { limitBlocks: 1, limitTransactions: 2 },
    });
    t.fail('Should throw an error');
  } catch (error) {
    const blocks = await blocksDAL.findAll();
    t.assert(blocks.length === 0, 'Should not have added the block to the db');
  }
});

test('Add New Blocks with transactions and a falsy output', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper, {falsyOutput: true});
  const blocksAdder = new BlocksAdder(networkHelper);

  try {
    await blocksAdder.addNewBlocks({
      data: { limitBlocks: 1, limitTransactions: 2 },
    });
    t.fail('Should throw an error');
  } catch (error) {
    const blocks = await blocksDAL.findAll();
    t.assert(blocks.length === 0, 'Should not have added the block to the db');
  }
});

test('Add New Blocks with transactions and a falsy input', async function(t) {
  await truncate();
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper, {falsyInput: true});
  const blocksAdder = new BlocksAdder(networkHelper);

  try {
    await blocksAdder.addNewBlocks({
      data: { limitBlocks: 1, limitTransactions: 2 },
    });
    t.fail('Should throw an error');
  } catch (error) {
    const blocks = await blocksDAL.findAll();
    t.assert(blocks.length === 0, 'Should not have added the block to the db');
  }
});
