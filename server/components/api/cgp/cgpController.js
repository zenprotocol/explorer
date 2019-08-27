'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const cgpBLL = require('./cgpBLL');

module.exports = {
  relevantInterval: async function(req, res) {
    const { interval } = req.query;
    const formattedInterval = formatInterval(interval);

    const result = await cgpBLL.findIntervalAndTally({ interval: formattedInterval });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  votes: async function(req, res) {
    const { interval, page, pageSize } = req.query;
    const { type } = req.params;
    const formattedInterval = formatInterval(interval);

    const votes = await cgpBLL.findAllVotesByInterval({
      interval: formattedInterval,
      type,
      page,
      pageSize,
    });
    if (votes) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, votes));
    } else {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }
  },
  results: async function(req, res) {
    const { interval, page, pageSize } = req.query;
    const { type } = req.params;
    const formattedInterval = formatInterval(interval);

    const result = await cgpBLL.findAllVoteResults({ interval: formattedInterval, type, page, pageSize });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  payoutBallots: async function(req, res) {
    const { page, pageSize } = req.query;

    const result = await cgpBLL.findAllBallots({ type: 'payout', page, pageSize });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};

function formatInterval(interval) {
  return isNaN(Number(interval)) || Number(interval) === 0 ? null : Number(interval);
}
