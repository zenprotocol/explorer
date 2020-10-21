'use strict';

const blocksDAL = require('./blocksDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const isHash = require('../../../lib/isHash');
const config = require('../../../config/Config');
const calcTotalZpByHeight = require('../../../lib/calcTotalZpByHeight');

module.exports = {
  findAllAndCount: async function({ page = 0, pageSize = 10, sorted } = {}) {
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'blockNumber', desc: true }];

    const query = createQueryObject({ page, pageSize, sorted: sortBy });
    return await Promise.all([blocksDAL.count(), blocksDAL.findAll(query)]).then(
      blocksDAL.getItemsAndCountResult
    );
  },
  findByHashOrBlockNumber: async function({ hashOrBlockNumber } = {}) {
    if (!hashOrBlockNumber || (!isHash(hashOrBlockNumber) && isNaN(hashOrBlockNumber))) {
      return null;
    }
    return isHash(hashOrBlockNumber)
      ? await blocksDAL.findByHash(hashOrBlockNumber)
      : await blocksDAL.findById(hashOrBlockNumber);
  },
  count: async function() {
    return await blocksDAL.count();
  },
  getCurrentBlockNumber: async function() {
    const latestBlock = await blocksDAL.findLatest();
    return latestBlock ? latestBlock.blockNumber : 0;
  },
  getTotalZp: async function() {
    const height = await blocksDAL.count();
    return calcTotalZpByHeight({ height, genesis: config.get('GENESIS_TOTAL_ZP') });
  },
};
