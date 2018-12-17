'use strict';

const blocksDAL = require('./blocksDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const isHash = require('../../../lib/isHash');

module.exports = {
  findAllAndCount: async function({ page = 0, pageSize = 10, sorted } = {}) {
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'blockNumber', desc: true }];

    const query = createQueryObject({ page, pageSize, sorted: sortBy });
    return await Promise.all([blocksDAL.count(), blocksDAL.findAllWithCoinbase(query)]).then(
      blocksDAL.getItemsAndCountResult
    );
  },
  findByHashOrBlockNumber: async function({ hashOrBlockNumber } = {}) {
    if (!hashOrBlockNumber || (!isHash(hashOrBlockNumber) && isNaN(hashOrBlockNumber))) {
      return null;
    }
    return isHash(hashOrBlockNumber)
      ? await blocksDAL.findByHash(hashOrBlockNumber)
      : await blocksDAL.findByBlockNumber(hashOrBlockNumber);
  },
  count: async function() {
    return await blocksDAL.count();
  },
  getById: async function({ id } = {}) {
    return await blocksDAL.findById(id);
  },
  getTotalZp: async function() {
    const blocksCount = await blocksDAL.count();
    return (20000000 + (blocksCount - 1) * 50) * 100000000;
  },
};
