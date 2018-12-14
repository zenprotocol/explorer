'use strict';

const httpStatus = require('http-status');
const transactionsDAL = require('../transactions/transactionsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const outputsDAL = require('../outputs/outputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  show: async function(req, res) {
    const address = req.params.address;
    const addressExists = await addressesDAL.addressExists(address);
    if(!addressExists) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
    
    const [assetAmounts, zpAmounts, totalTxs] = await Promise.all([
      addressesDAL.getAssetAmounts(address),
      addressesDAL.getZpSentReceived(address),
      transactionsDAL.countByAddress(address),
    ]);
    
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, {
      address,
      totalTxs,
      assetAmounts,
      zpAmounts,
    }));
  },
  findAllAssets: async function(req, res) {
    const assets = await outputsDAL.findAllAddressAssets(req.params.address);

    if (assets.length) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, assets));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  balanceZp: async function(req, res) {
    const address = req.params.address;
    const zpAmounts = await addressesDAL.getZpBalance(address);

    if (zpAmounts) {
      res.status(httpStatus.OK).json(Number(zpAmounts.balance) / 100000000);
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
