'use strict';

const transactionsDAL = require('../transactions/transactionsDAL');
const addressesDAL = require('./addressesDAL');
const outputsDAL = require('../outputs/outputsDAL');

module.exports = {
  findOne: async function({ address } = {}) {
    const addressExists = await addressesDAL.addressExists(address);
    if (!addressExists) {
      return null;
    }

    const [assetAmounts, totalTxs] = await Promise.all([
      addressesDAL.getAssetAmounts(address),
      transactionsDAL.countByAddress(address),
    ]);

    return {
      address,
      totalTxs,
      assetAmounts,
    };
  },
  findAllAssets: async function({ address } = {}) {
    return await outputsDAL.findAllAddressAssets(address);
  },
  balanceZp: async function({ address } = {}) {
    const balance = await addressesDAL.getZpBalance(address);

    if (balance.length > 0) {
      return Number(balance[0].balance);
    }
    return null;
  },
};
