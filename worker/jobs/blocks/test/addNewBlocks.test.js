'use strict';

const test = require('blue-tape');
const Service = require('../../../../server/lib/Service');
const truncate = require('../../../../common/test/truncate');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const addNewBlocks = require('../addNewBlocks');
const Config = require('../../../../server/config/Config');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('Add New Blocks When 0 in DB', async function(t) {
  await truncate();

  // get latest block number from zp node
  const info = await Service.blocks.getChainInfo();
  t.assert(info.blocks, 'chain info should contain a "blocks" attribute');
  t.assert(typeof info.blocks === 'number', '"blocks" attribute should be a number');
  // compare and set a bool indicating if should add
  let shouldAddBlocks = false;
  if (info.blocks > 0) {
    shouldAddBlocks = true;
  }

  try {
    const numOfBlocksAdded = await addNewBlocks();

    if (shouldAddBlocks) {
      t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');

      const latestBlocksAfterAdd = await blocksDAL.findLatest();
      t.assert(latestBlocksAfterAdd.length > 0, 'There should be new blocks in the db');
      t.equals(
        latestBlocksAfterAdd[0].blockNumber,
        info.blocks,
        'The block numbers should be equal'
      );
    }
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }
});

test('Add New Blocks When some already in DB', async function(t) {
  await truncate();

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
  const latestBlock = latestBlocks[0];

  // get latest block number from zp node
  const info = await Service.blocks.getChainInfo();
  t.assert(info.blocks, 'chain info should contain a "blocks" attribute');
  t.assert(typeof info.blocks === 'number', '"blocks" attribute should be a number');
  // compare and set a bool indicating if should add
  let shouldAddBlocks = false;
  if (info.blocks > latestBlock.blockNumber) {
    shouldAddBlocks = true;
  }

  try {
    const numOfBlocksAdded = await addNewBlocks();

    if (shouldAddBlocks) {
      t.assert(numOfBlocksAdded > 0, 'Should have added new blocks');

      const latestBlocksAfterAdd = await blocksDAL.findLatest();
      const latestBlockAfterAdd = latestBlocksAfterAdd[0];
      t.equals(
        latestBlockAfterAdd.blockNumber,
        info.blocks,
        'The block numbers should be equal'
      );
    }
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }
});

test('Add New Blocks - Empty response from chain node', async function(t) {
  await truncate();

  // mute the service to get empty responses
  Service.config.mute(true);

  // get latest block number from zp node
  const info = await Service.blocks.getChainInfo();
  t.assert(!info.blocks, 'chain info "blocks" attribute should be empty');

  try {
    const numOfBlocksAdded = await addNewBlocks();
    t.equals(numOfBlocksAdded, 0, 'Should not have added new blocks');
  } catch (error) {
    t.fail('should not throw an error');
  }

  Service.config.mute(false);
});

test('Add New Blocks - Network error when getting blocks info from node', async function(t) {
  await truncate();

  // mute the service to get empty responses
  Service.config.setBaseUrl('http://1.1.1.1:8080');
  Service.config.setTimeout(500);
  try {
    const numOfBlocksAdded = await addNewBlocks();
    t.fail('Should throw an error');
  } catch (error) {
    t.equals(error.name, 'NetworkError', 'Should throw a custom NetworkError');
  }
  
  Service.config.setBaseUrl(Config.get('zp:node'));
  Service.config.setTimeout(0);
});
