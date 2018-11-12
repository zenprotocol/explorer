'use strict';

const httpStatus = require('http-status');
const assetsDAL = require('./assetsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  show: async function(req, res) {
    if(!req.params.asset) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const asset = await assetsDAL.findOutstanding(req.params.asset);
    if (asset) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, asset));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
