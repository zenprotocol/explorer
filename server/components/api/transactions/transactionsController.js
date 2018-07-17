'use strict';

const httpStatus = require('http-status');
const transactionsDAL = require('./transactionsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');
const getTransactionAssets = require('./getTransactionAssets');
const isCoinbaseTX = require('./isCoinbaseTX');

module.exports = {
  index: async function(req, res) {
    // find by blockNumber or address
    const { blockNumber, address } = req.query;
    const page = req.query.page || 0;
    const pageSize = req.query.pageSize || 10;
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'createdAt', desc: true }];

    const query = createQueryObject({ page, pageSize, sorted });

    let countPromise;
    let findPromise;
    if (blockNumber && !isNaN(blockNumber)) {
      findPromise = transactionsDAL.findAllByBlockNumber(Number(blockNumber), query);
      countPromise = transactionsDAL.countByBlockNumber(Number(blockNumber));
    }
    else if (address) {
      findPromise = transactionsDAL.findAllByAddress(address, query);
      countPromise = transactionsDAL.countByAddress(address);
    }
    else {
      findPromise = transactionsDAL.findAll(query);
      countPromise = transactionsDAL.count();
    }

    const [count, transactions] = await Promise.all([countPromise, findPromise]);

    const customTXs = [];

    transactions.forEach(transaction => {
      const customTX = transactionsDAL.toJSON(transaction);
      customTX.isCoinbase = isCoinbaseTX(transaction);

      customTX['assets'] = getTransactionAssets(transaction);
      delete customTX.Inputs;
      delete customTX.Outputs;
      delete customTX.AddressTransactions;

      customTXs.push(customTX);
    });

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        total: count,
        items: customTXs,
      })
    );
  },
  show: async function(req, res) {
    const transaction = await transactionsDAL.findByHash(req.params.hash);
    const customTX = transactionsDAL.toJSON(transaction);
    customTX.isCoinbase = isCoinbaseTX(transaction);
    customTX['assets'] = getTransactionAssets(customTX);
    delete customTX.Inputs;
    delete customTX.Outputs;
    if (customTX) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, customTX));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  getById: async function(req, res) {
    const transaction = await transactionsDAL.findById(req.params.id);
    if (transaction) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, transaction));
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
