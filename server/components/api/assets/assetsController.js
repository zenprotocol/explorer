'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const assetsBLL = require('./assetsBLL');

module.exports = {
  index: async function(req, res) {
    const { page, pageSize, sorted } = req.query;
    const assets = await assetsBLL.findAll({ page, pageSize, sorted });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, assets));
  },
  show: async function(req, res) {
    const { asset } = req.params;
    if (!asset) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const item = await assetsBLL.findOne({ asset });
    if (item) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, item));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  keyholders: async function(req, res) {
    const { asset } = req.params;
    const { page, pageSize } = req.query;
    if (!asset) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const keyholders = await assetsBLL.keyholders({ asset, page, pageSize });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, keyholders));
  },
};
