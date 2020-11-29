'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const votesBLL = require('./repoVotesBLL');

module.exports = {
  index: async function(req, res) {
    const { interval, phase, page, pageSize } = req.query;

    const votes = await votesBLL.findAllVotesByInterval({
      interval,
      phase,
      page,
      pageSize,
    });

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, votes || []));
  },
  relevantInterval: async function(req, res) {
    const { interval, phase } = req.query;

    const result = await votesBLL.findIntervalAndTally({
      interval,
      phase,
    });
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  nextInterval: async function(req, res) {
    const result = await votesBLL.findNextInterval();
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  prevInterval: async function(req, res) {
    const result = await votesBLL.findPrevInterval();
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  getInterval: async function(req, res) {
    const { interval, phase } = req.query;
    const result = await votesBLL.findInterval({interval, phase});
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  currentNextOrPrev: async function(req, res) {
    const result = await votesBLL.currentNextOrPrev();
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  results: async function(req, res) {
    const { interval, phase, page, pageSize } = req.query;

    const result = await votesBLL.findAllVoteResults({
      interval,
      phase,
      page,
      pageSize,
    });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result || []));
  },
  recentIntervals: async function(req, res) {
    const result = await votesBLL.findRecentIntervals();
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
  },
  getCandidates: async function(req, res) {
    const { interval } = req.query;

    const result = await votesBLL.findContestantWinners({
      interval,
    });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result || []));
  },
};

