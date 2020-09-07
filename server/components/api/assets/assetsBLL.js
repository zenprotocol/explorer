'use strict';

const assetsDAL = require('./assetsDAL');
const contractsDAL = require('../contracts/contractsDAL');
const createQueryObject = require('../../../lib/createQueryObject');

module.exports = {
  findAll: async function({ page = 0, pageSize = 10 } = {}) {
    const query = createQueryObject({ page, pageSize, sorted: [{ id: 'keyholders', desc: true }] });
    return await Promise.all([
      assetsDAL.count(),
      assetsDAL.findAll(query),
    ]).then(assetsDAL.getItemsAndCountResult);
  },
  findOne: async function({ asset } = {}) {
    if (!asset) {
      return null;
    }

    const [assetOutstanding, contract] = await Promise.all([
      assetsDAL.findOutstanding(asset),
      contractsDAL.findById(asset.substring(0, 72)),
    ]);
    if (assetOutstanding) {
      return Object.assign(
        {},
        assetOutstanding,
        contract && {
          contract: { id: contract.id, address: contract.address },
        }
      );
    }
    return null;
  },
  keyholders: async function({ asset, page = 0, pageSize = 10 } = {}) {
    if (!asset) {
      return [];
    }

    const query = createQueryObject({ page, pageSize });
    return await assetsDAL.keyholders(Object.assign({ asset }, query));
  },
};
