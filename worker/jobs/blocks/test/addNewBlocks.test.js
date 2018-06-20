'use strict';

const test = require('blue-tape');
const service = require('../../../../server/lib/service');
const truncate = require('../../../../test/truncate');
const blocksDAL = require('../../../../server/components/blocks/blocksDAL');
const addNewBlocks = require('../addNewBlocks');
const Config = require('../../../../server/config/Config');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('Add New Blocks When 0 in DB', async function(t) {
  await truncate();

  // get latest block number from zp node
  const info = await service.blocks.getChainInfo();
  t.assert(info.blocks, 'chain info should contain a "blocks" attribute');
  t.assert(typeof info.blocks === 'number', '"blocks" attribute attribute should be a number');
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
    // todo - maybe later add errors management
    t.fail('addNewBlocks should not throw an error');
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
  const info = await service.blocks.getChainInfo();
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
    // todo - maybe later add errors management
    t.fail('addNewBlocks should not throw an error');
  }
});
