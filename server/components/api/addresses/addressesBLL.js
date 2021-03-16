'use strict';

const { Decimal } = require('decimal.js');
const addressesDAL = require('./addressesDAL');
const getChain = require('../../../lib/getChain');
const BlockchainParser = require('../../../lib/BlockchainParser');
const getAssetName = require('../../../lib/getAssetName');

module.exports = {
  findOne: async function ({ address } = {}) {
    const [exists, assetAmounts, chain] = await Promise.all([
      addressesDAL.addressExists(address),
      addressesDAL.findAllByAddress(address),
      getChain(),
    ]);

    const blockchainParser = new BlockchainParser(chain);

    if (!exists && !blockchainParser.isAddressValid(address)) return null;

    return {
      address,
      pkHash: blockchainParser.getPkHashFromAddress(address),
      totalTxs: assetAmounts && assetAmounts.length ? assetAmounts[0].txsCount : 0,
      assetAmounts: assetAmounts.map(addMetaDataToAssets),
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

function addMetaDataToAssets(asset) {
  return { ...asset.dataValues, metadata: getAssetName(asset.dataValues.asset) };
}