'use strict';

const test = require('blue-tape');
const Service = require('../../../../server/lib/Service');
const truncate = require('../../../../common/test/truncate');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const mock = require('./mock');
const BlocksAdder = require('../BlocksAdder');
const Config = require('../../../../server/config/Config');

const ADD_BLOCKS_LIMIT = 1;

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
      data: { limit: ADD_BLOCKS_LIMIT, limitTransactions: 1 },
    });

    t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');

    const latestBlocksAfterAdd = await blocksDAL.findLatest();
    t.assert(latestBlocksAfterAdd.length > 0, 'There should be new blocks in the db');
    t.equals(
      latestBlocksAfterAdd[0].blockNumber,
      ADD_BLOCKS_LIMIT,
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
      data: { limit: ADD_BLOCKS_LIMIT, limitTransactions: 1 },
    });

    t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');

    const latestBlocksAfterAdd = await blocksDAL.findLatest();
    const latestBlockAfterAdd = latestBlocksAfterAdd[0];
    t.equals(
      latestBlockAfterAdd.blockNumber,
      1 + ADD_BLOCKS_LIMIT,
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
    await blocksAdder.addNewBlocks({ data: { limit: ADD_BLOCKS_LIMIT } });
    t.fail('Should throw an error');
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }

  Service.config.setBaseUrl(Config.get('zp:node'));
  Service.config.setTimeout(0);
});

// test('Add New Blocks with transactions', async function(t) {
//   await truncate();
//   const blocksAdder = new BlocksAdder();

//   // get latest block number from zp node
//   const info = await Service.blocks.getChainInfo();
//   let shouldAddBlocks = false;
//   if (info.blocks > 0) {
//     shouldAddBlocks = true;
//   }

//   try {
//     const numOfBlocksAdded = await blocksAdder.addNewBlocks({ data: { limit: ADD_BLOCKS_LIMIT } });

//     if (shouldAddBlocks) {
//       t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');

//       const latestBlocksAfterAdd = await blocksDAL.findLatest();
//       t.assert(latestBlocksAfterAdd.length > 0, 'There should be new blocks in the db');
//       const latestBlockAfterAdd = latestBlocksAfterAdd[0];
//       t.equals(
//         latestBlockAfterAdd.blockNumber,
//         ADD_BLOCKS_LIMIT,
//         'The block numbers should be equal'
//       );

//       const blockFromNode = await Service.blocks.getBlock(latestBlockAfterAdd.blockNumber);
//       console.log(blockFromNode);
//     }
//   } catch (error) {
//     t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
//   }
// });
