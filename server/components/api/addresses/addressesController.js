'use strict';

const httpStatus = require('http-status');
const transactionsDAL = require('../transactions/transactionsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const outputsDAL = require('../outputs/outputsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');
const isCoinbaseTX = require('../transactions/isCoinbaseTX');
const getTransactionAssets = require('../transactions/getTransactionAssets');

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
    const [sent, received] = await Promise.all([
      addressesDAL.getSentSum(req.params.address),
      addressesDAL.getReceivedSum(req.params.address),
    ]);

    if (address) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, {
        address,
        received,
        sent,
        balance: (Number(received) - Number(sent))
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
