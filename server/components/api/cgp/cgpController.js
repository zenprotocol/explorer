'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const cgpBLL = require('./cgpBLL');

module.exports = {
  relevantInterval: async function(req, res) {
    const { interval, phase } = req.query;

    const result = await cgpBLL.findIntervalAndTally({ interval, phase });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  votes: async function(req, res) {
    const { interval, page, pageSize } = req.query;
    const { type } = req.params;

    const votes = await cgpBLL.findAllVotesByInterval({
      interval,
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

    const result = await cgpBLL.findAllVoteResults({ interval, type, page, pageSize });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  zpParticipated: async function(req, res) {
    const { interval } = req.query;
    const { type } = req.params;

    const result = await cgpBLL.findZpParticipated({ interval, type });
    if (result === null) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
  },
  nominationBallots: async function(req, res) {
    const { interval, page, pageSize } = req.query;

    const result = await cgpBLL.findNomineesBallots({ interval, page, pageSize });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  payoutBallots: async function(req, res) {
    const { interval, page, pageSize } = req.query;

    const result = await cgpBLL.findAllBallots({ type: 'payout', interval, page, pageSize });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  ballotContent: async function(req, res) {
    const { ballot } = req.query;
    const { type } = req.params;

    const result = ['payout', 'nomination'].includes(type)
      ? await cgpBLL.getPayoutBallotContent({ ballot })
      : await cgpBLL.getAllocationBallotContent({ ballot });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
