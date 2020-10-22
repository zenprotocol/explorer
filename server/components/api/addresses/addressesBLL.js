'use strict';

const { Decimal } = require('decimal.js');
const addressesDAL = require('./addressesDAL');
const addressTxsDAL = require('../address-txs/addressTxsDAL');
const getChain = require('../../../lib/getChain');
const BlockchainParser = require('../../../lib/BlockchainParser');

module.exports = {
  findOne: async function ({ address } = {}) {
    const [assetAmounts, totalTxs, chain] = await Promise.all([
      addressesDAL.findAllByAddress(address),
      addressTxsDAL.countByAddress(address),
      getChain(),
    ]);

    if (!assetAmounts.length) return null;

    const blockchainParser = new BlockchainParser(chain);

    return {
      address,
      pkHash: blockchainParser.getPkHashFromAddress(address),
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
