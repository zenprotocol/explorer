'use strict';

const faker = require('faker');
const blocksDAL = require('../../server/components/api/blocks/blocksDAL');

module.exports = async function(fromBlockNumber, toBlockNumber, lastHash = '') {
  const blocks = [];
  for (let i = fromBlockNumber; i <= toBlockNumber; i++) {
    blocks.push({
      version: 0,
      hash: i === toBlockNumber && lastHash ? lastHash : String(i), // for reorgs
      parent: String(i - 1),
      blockNumber: i,
      commitments: 'test commitments',
      timestamp: 123456789,
      difficulty: 486539008,
      nonce1: -8412464686019857620,
      nonce2: 25078183,
    });
  }
  await blocksDAL.bulkCreate(blocks);
};
