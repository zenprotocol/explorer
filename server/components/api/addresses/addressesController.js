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
    
    const [assetAmounts, totalTxs] = await Promise.all([
      addressesDAL.getAssetAmounts(address),
      transactionsDAL.countByAddress(address),
    ]);
    
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, {
      address,
      totalTxs,
      assetAmounts,
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
    const balance = await addressesDAL.getZpBalance(address);

    if (balance.length > 0) {
      res.status(httpStatus.OK).json(Number(balance[0].balance));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
