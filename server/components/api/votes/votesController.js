'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const votesBLL = require('./votesBLL');

module.exports = {
  index: async function(req, res) {
    const { interval, page, pageSize } = req.query;
    const vote = await votesBLL.findAllVotesByInterval({ interval, page, pageSize });
    if (vote) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, vote));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  show: async function(req, res) {
    const { interval } = req.query;
    const result = await votesBLL.findIntervalAndTally({ interval });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
