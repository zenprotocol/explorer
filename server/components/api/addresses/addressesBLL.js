'use strict';

const transactionsDAL = require('../transactions/transactionsDAL');
const addressesDAL = require('./addressesDAL');
const outputsDAL = require('../outputs/outputsDAL');
const blocksBLL = require('../blocks/blocksBLL');

module.exports = {
  findOne: async function({ address } = {}) {
    const addressExists = await addressesDAL.addressExists(address);
    if (!addressExists) {
      return null;
    }

    const [assetAmounts, zpAmounts, totalTxs] = await Promise.all([
      addressesDAL.getAssetAmounts(address),
      addressesDAL.getZpSentReceived(address),
      transactionsDAL.countByAddress(address),
    ]);

    return {
      address,
      totalTxs,
      assetAmounts,
      zpAmounts,
    };
  },
  findAllAssets: async function({ address } = {}) {
    return await outputsDAL.findAllAddressAssets(address);
  },
  balance: async function({ address, blockNumber: suppliedBlockNumber } = {}) {
    const blockNumber = suppliedBlockNumber
      ? suppliedBlockNumber
      : await blocksBLL.getCurrentBlockNumber();
    return addressesDAL.snapshotAddressBalancesByBlock({ address, blockNumber });
  },
  balanceZp: async function({ address } = {}) {
    const zpAmounts = await addressesDAL.getZpBalance(address);

    if (zpAmounts) {
      return Number(zpAmounts.balance) / 100000000;
    }
    return null;
  },
};
