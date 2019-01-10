'use strict';

const contractsDAL = require('./contractsDAL');
const createQueryObject = require('../../../lib/createQueryObject');

module.exports = {
  findAll: async function({ page = 0, pageSize = 10, sorted, blockNumber } = {}) {
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'expiryBlock', desc: true }];
    const query = createQueryObject({ page, pageSize, sorted: sortBy });
    return await contractsDAL.findAllWithAssetsCountTxCountAndCountOrderByNewest({
      ...query,
      blockNumber,
    });
  },
  findByAddress: async function({ address } = {}) {
    if (!address) {
      return null;
    }

    return await contractsDAL.findByAddress(address);
  },
  findActivationTransactions: async function({ contract } = {}) {
    return await contractsDAL.getActivationTransactions(contract);
  },
  findLastActivationTransaction: async function({ contract } = {}) {
    return await contractsDAL.getLastActivationTransaction(contract);
  },
  assets: async function({ address, page = 0, pageSize = 10 } = {}) {
    if (!address) {
      return [];
    }

    const contract = await contractsDAL.findByAddress(address);
    if (contract) {
      const query = createQueryObject({ page, pageSize, sorted: [] });
      return await contractsDAL.findAllOutstandingAssets(contract.id, query);
    } else {
      return [];
    }
  },
  commands: async function({ address, page = 0, pageSize = 10 } = {}) {
    if (!address) {
      return [];
    }

    const contract = await contractsDAL.findByAddress(address);
    if (contract) {
      const query = createQueryObject({ page, pageSize, sorted: [] });
      return await contractsDAL.findCommandsWithRelations(contract.id, query);
    } else {
      return [];
    }
  },
};
