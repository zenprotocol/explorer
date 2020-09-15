'use strict';

const { Decimal } = require('decimal.js');
const addressesDAL = require('./addressesDAL');
const addressTxsDAL = require('../address-txs/addressTxsDAL');

module.exports = {
  findOne: async function ({ address } = {}) {
    const [assetAmounts, totalTxs] = await Promise.all([
      addressesDAL.findAllByAddress(address),
      addressTxsDAL.countByAddress(address),
    ]);

    if (!assetAmounts.length) return null;

    return {
      address,
      totalTxs,
      assetAmounts,
    };
  },
  findAllAssets: async function ({ address } = {}) {
    return addressesDAL.findAllByAddress(address);
  },
  balance: async function ({ address, blockNumber: suppliedBlockNumber } = {}) {
    return suppliedBlockNumber
      ? addressesDAL.snapshotAddressBalancesByBlock({ address, blockNumber: suppliedBlockNumber })
      : addressesDAL
          .findAllByAddress(address)
          .then((result) => result.map((item) => ({ asset: item.asset, amount: item.balance })));
  },
  balanceZp: async function ({ address } = {}) {
    const zpAmounts = await addressesDAL.getZpBalance(address);

    if (zpAmounts) {
      return new Decimal(zpAmounts.balance || 0).dividedBy(100000000).toNumber();
    }
    return null;
  },
};
