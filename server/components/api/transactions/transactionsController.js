'use strict';

const httpStatus = require('http-status');
const transactionsDAL = require('./transactionsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');
const getTransactionAssets = require('./getTransactionAssets');

module.exports = {
  index: async function(req, res) {
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'createdAt', desc: true }];

    const query = createQueryObject({sorted});
    const [count, allItems] = await Promise.all([transactionsDAL.count(), transactionsDAL.findAll(query)]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allItems,
        total: count,
      })
    );
  },
  show: async function(req, res) {
    const transaction = await transactionsDAL.findByHash(req.params.hash);
    const customTX = transactionsDAL.toJSON(transaction);
    customTX['assets'] = getTransactionAssets(customTX);
    delete customTX.Inputs;
    delete customTX.Outputs;
    if (customTX) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, customTX));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  create: async function(req, res) {
    const transaction = await transactionsDAL.create(req.body);
    res.status(httpStatus.CREATED).json(jsonResponse.create(httpStatus.CREATED, transaction));
  },
  update: async function(req, res) {
    const transaction = await transactionsDAL.update(req.params.id, req.body);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, transaction));
  },
  delete: async function(req, res) {
    await transactionsDAL.delete(req.params.id);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK));
  },
};
