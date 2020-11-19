'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const votesBLL = require('./repoVotesBLL');

module.exports = {
  index: async function(req, res) {
    const { interval, phase, page, pageSize } = req.query;
    const formattedInterval = formatInterval(interval);

    const votes = await votesBLL.findAllVotesByInterval({
      interval: formattedInterval,
      phase,
      page,
      pageSize,
    });

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, votes || []));
  },
  relevantInterval: async function(req, res) {
    const { interval, phase } = req.query;
    const formattedInterval = formatInterval(interval);

    const result = await votesBLL.findIntervalAndTally({
      interval: formattedInterval,
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
  currentOrNextInterval: async function(req, res) {
    const result = await votesBLL.findCurrentOrNextInterval();
    if (result) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  results: async function(req, res) {
    const { interval, phase, page, pageSize } = req.query;
    const formattedInterval = formatInterval(interval);

    const result = await votesBLL.findAllVoteResults({
      interval: formattedInterval,
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
    const formattedInterval = formatInterval(interval);

    const result = await votesBLL.findContestantWinners({
      interval: formattedInterval,
    });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result || []));
  },
};

function formatInterval(interval) {
  return isNaN(Number(interval)) || Number(interval) === 0 ? null : Number(interval);
}
