'use strict';

const contractsDAL = require('./contractsDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const getContractName = require('../../../lib/getContractName');
const getAssetName = require('../../../lib/getAssetName');

module.exports = {
  findAll: async function ({ page = 0, pageSize = 10, sorted, blockNumber } = {}) {
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'lastActivationBlock', desc: true }];
    const query = createQueryObject({ page, pageSize, sorted: sortBy });
    const result = await contractsDAL.findAllWithAssetsCountTxCountAndCountOrderByNewest({
      ...query,
      blockNumber,
    });

    return {
      count: result.count,
      items: result.items.map(addMetaDataToContract),
    };
  },
  findByAddress: async function ({ address } = {}) {
    if (!address) {
      return null;
    }

    const contract = await contractsDAL.findByAddress(address);
    return contract ? addMetaDataToContract(contract.toJSON()) : null;
  },
  findActivationTxs: async function ({ contract } = {}) {
    return await contractsDAL.getActivationTxs(contract);
  },
  assets: async function ({ address, page = 0, pageSize = 10 } = {}) {
    if (!address) {
      return [];
    }

    const contract = await contractsDAL.findByAddress(address);
    if (contract) {
      const query = createQueryObject({ page, pageSize, sorted: [] });
      const result = await contractsDAL.findAllOutstandingAssets(contract.id, query);
      return {
        count: result.count,
        items: result.items.map(addMetaDataToAssets),
      };
      
    } else {
      return [];
    }
  },
  executions: async function ({ address, page = 0, pageSize = 10 } = {}) {
    if (!address) {
      return [];
    }

    const contract = await contractsDAL.findByAddress(address);
    if (contract) {
      const query = createQueryObject({ page, pageSize, sorted: [] });
      return await contractsDAL.findExecutions(contract.id, query);
    } else {
      return [];
    }
  },
};

function addMetaDataToContract(contract) {
  return { ...contract, metadata: getContractName(contract.id) };
}

function addMetaDataToAssets(asset) {
  return { ...asset, metadata: getAssetName(asset.asset) };
}
