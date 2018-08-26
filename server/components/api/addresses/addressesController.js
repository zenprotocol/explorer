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
    
    const [sent, received, assets, totalTxs] = await Promise.all([
      addressesDAL.getSentSums(address),
      addressesDAL.getReceivedSums(address),
      outputsDAL.findAllAddressAssets(address),
      transactionsDAL.countByAddress(address),
    ]);

    const alreadyAddedAssets = [];
    const balance = received.map((item) => {
      alreadyAddedAssets.push(item.asset);
      return {
        asset: item.asset,
        total: item.total,
      };
    });

    sent.forEach((sentItem) => {
      if(alreadyAddedAssets.includes(sentItem.asset)) {
        for (let i = 0; i < balance.length; i++) {
          const balanceItem = balance[i];
          if (balanceItem.asset === sentItem.asset) {
            balanceItem.total = Number(balanceItem.total) - Number(sentItem.total);
          }
        }
      }
      else {
        balance.push({
          asset: sent.asset,
          total: -1 * sent.total,
        });
      }
    });
    
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, {
      address,
      totalTxs,
      assets,
      received,
      sent,
      balance,
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
};
