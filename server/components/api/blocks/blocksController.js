'use strict';

const httpStatus = require('http-status');
const blocksDAL = require('./blocksDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');
const isHash = require('../../../lib/isHash');

module.exports = {
  index: async function(req, res) {
    const page = req.query.page || 0;
    const pageSize = req.query.pageSize || 10;
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'blockNumber', desc: true }];

    const query = createQueryObject({ page, pageSize, sorted });
    const [count, allBlocks] = await Promise.all([blocksDAL.count(), blocksDAL.findAllWithCoinbase(query)]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allBlocks,
        total: count,
      })
    );
  },
  show: async function(req, res) {
    const hashOrBlockNumber = req.params.hashOrBlockNumber;
    if (!hashOrBlockNumber || (!isHash(hashOrBlockNumber) && isNaN(hashOrBlockNumber))) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }

    const block = isHash(hashOrBlockNumber)
      ? await blocksDAL.findByHash(hashOrBlockNumber)
      : await blocksDAL.findByBlockNumber(hashOrBlockNumber);

    if (block) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  count: async function(req, res) {
    const count = await blocksDAL.count();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, count)
    );
  },
  getById: async function(req, res) {
    const block = await blocksDAL.findById(req.params.id);
    if (block) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  getTotalZp: async function(req, res) {
    const blocksCount = await blocksDAL.count();
    let total = (20000000 + (blocksCount - 1) * 50) * 100000000;

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, { total }));
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
