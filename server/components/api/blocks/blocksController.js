'use strict';

const httpStatus = require('http-status');
const blocksDAL = require('./blocksDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');
const getTransactionAssets = require('../transactions/getTransactionAssets');
const isCoinbaseTX = require('../transactions/isCoinbaseTX');

module.exports = {
  index: async function(req, res) {
    const page = req.query.page || 0;
    const pageSize = req.query.pageSize;
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'blockNumber', desc: true }];

    const query = createQueryObject({ page, pageSize, sorted });
    const [count, allBlocks] = await Promise.all([
      blocksDAL.count(),
      blocksDAL.findAllCountTransactions(query),
    ]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allBlocks,
        total: count,
      })
    );
  },
  findByBlockNumber: async function(req, res) {
    const block = await blocksDAL.findByBlockNumber(req.params.blockNumber);
    const customBlock = blocksDAL.toJSON(block);

    customBlock.Transactions.forEach(transaction => {
      transaction.isCoinbase = isCoinbaseTX(transaction);

      // make sure the order is right
      transaction.Outputs.sort((a, b) => {
        return Number(b.index) < Number(a.index);
      });
      transaction.Inputs.sort((a, b) => {
        return Number(b.index) < Number(a.index);
      });

      transaction['assets'] = getTransactionAssets(transaction);
      delete transaction.Inputs;
      delete transaction.Outputs;
    });
    if (customBlock) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, customBlock));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  getById: async function(req, res) {
    const block = await blocksDAL.findById(req.params.id);
    if (block) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  create: async function(req, res) {
    const block = await blocksDAL.create(req.body);
    res.status(httpStatus.CREATED).json(jsonResponse.create(httpStatus.CREATED, block));
  },
  update: async function(req, res) {
    const block = await blocksDAL.update(req.params.id, req.body);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
  },
  delete: async function(req, res) {
    await blocksDAL.delete(req.params.id);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK));
  },
};
