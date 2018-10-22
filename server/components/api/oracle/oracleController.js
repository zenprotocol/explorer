'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const service = require('../../../lib/Service');

function toArray(something) {
  if (!something) {
    return [];
  }
  return Array.isArray(something) ? something : [something];
}

module.exports = {
  data: async function(req, res) {
    const { date, ticker } = req.query;
    if (!date && !ticker) {
      throw new HttpError(httpStatus.BAD_REQUEST, 'Either date or ticker must be supplied');
    }
    const data = await service.oracle.data(ticker, date);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, toArray(data)));
  },
  proof: async function(req, res) {
    const { date, ticker } = req.query;
    if (!date || !ticker) {
      throw new HttpError(httpStatus.BAD_REQUEST, 'Both date and ticker must be supplied');
    }
    const data = await service.oracle.proof(ticker, date);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, data));
  },
  latest: async function(req, res) {
    const data = await service.oracle.data();
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, data));
  },
};
