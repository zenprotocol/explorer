'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const addressBLL = require('./addressesBLL');

module.exports = {
  show: async function(req, res) {
    const address = await addressBLL.findOne({ address: req.params.address });

    if (address) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, address));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  findAllAssets: async function(req, res) {
    const assets = await addressBLL.findAllAssets({ address: req.params.address });

    if (assets.length) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, assets));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  balance: async function(req, res) {
    const balance = await addressBLL.balance({ address: req.params.address, blockNumber: req.query.blockNumber });

    // if no assets found balance will be an empty array
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, balance));
  },
  balanceZp: async function(req, res) {
    const balance = await addressBLL.balanceZp({ address: req.params.address });

    if (balance !== null) {
      res.status(httpStatus.OK).json(balance);
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
