'use strict';

const faker = require('faker');
const blocksDAL = require('../../server/components/api/blocks/blocksDAL');

module.exports = async function(fromBlockNumber, toBlockNumber) {
  for (let i = fromBlockNumber; i <= toBlockNumber; i++) {
    await blocksDAL.create({
      version: 0,
      hash: faker.random.uuid(),
      parent: faker.random.uuid(),
      blockNumber: i,
      commitments: 'test commitments',
      timestamp: 123456789,
      difficulty: 486539008,
      nonce1: -8412464686019857620,
      nonce2: 25078183,
    });
  }
};
