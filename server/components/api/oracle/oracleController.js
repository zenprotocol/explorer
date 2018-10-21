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
  lastUpdated: async function(req, res) {
    const data = await service.oracle.data('GOOG');
    if(data && Array.isArray(data) && data.length) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, data[data.length - 1].date));
    }
    else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  latestData: async function(req, res) {
    const tickerData = await service.oracle.data('GOOG');
    if(!tickerData) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
    const data = await service.oracle.data(null, tickerData[tickerData.length - 1].date);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, data));
  },
};
