'use strict';

const httpStatus = require('http-status');
const transactionsDAL = require('../transactions/transactionsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const outputsDAL = require('../outputs/outputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');

module.exports = {
  index: async function(req, res) {
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'createdAt', desc: true }];

    const query = createQueryObject({ sorted });
    const [count, allItems] = await Promise.all([transactionsDAL.count(), transactionsDAL.findAll(query)]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allItems,
        total: count,
      })
    );
  },
  show: async function(req, res) {
    const address = req.params.address;
    const [sent, received, assets] = await Promise.all([
      addressesDAL.getSentSums(address),
      addressesDAL.getReceivedSums(address),
      outputsDAL.findAllAddressAssets(address)
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
    if (address) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, {
        address,
        assets,
        received,
        sent,
        balance,
      }));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
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
