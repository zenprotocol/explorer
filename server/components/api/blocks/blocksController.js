'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const blocksBLL = require('./blocksBLL');

module.exports = {
  index: async function(req, res) {
    const itemsAndCount = await blocksBLL.findAllAndCount({
      page: req.query.page,
      pageSize: req.query.pageSize,
      sorted: req.query.sorted,
    });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, itemsAndCount));
  },
  show: async function(req, res) {
    const block = await blocksBLL.findByHashOrBlockNumber({
      hashOrBlockNumber: req.params.hashOrBlockNumber,
    });

    if (block) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  count: async function(req, res) {
    const count = await blocksBLL.count();

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, count));
  },
  getTotalZp: async function(req, res) {
    let total = await blocksBLL.getTotalZp();

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, { total }));
  },
};
