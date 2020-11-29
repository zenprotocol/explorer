'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../../../lib/jsonResponse');
const getChain = require('../../../../../lib/getChain');
const bll = require('./interval1CacheBLL');

/**
 * Loads the cached version of interval 1 (main net) which had a different structure
 */

module.exports = {
  index: async function(req, res, next) {
    const { interval, page = 0, pageSize = 10 } = req.query;
    const chain = await getChain();

    if (interval == 1 && chain === 'main') {
      res
        .status(httpStatus.OK)
        .json(jsonResponse.create(httpStatus.OK, bll.votes({ page, pageSize })));
    } else {
      next();
    }
  },
  relevantInterval: async function(req, res, next) {
    const { interval } = req.query;
    const chain = await getChain();

    if (interval == 1 && chain === 'main') {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, bll.relevantInterval()));
    } else {
      next();
    }
  },
  getInterval: async function(req, res, next) {
    next();
  },
  nextInterval: async function(req, res, next) {
    next();
  },
  prevInterval: async function(req, res, next) {
    next();
  },
  currentNextOrPrev: async function(req, res, next) {
    next();
  },
  results: async function(req, res, next) {
    const { interval, page = 0, pageSize = 10 } = req.query;
    const chain = await getChain();

    if (interval == 1 && chain === 'main') {
      res
        .status(httpStatus.OK)
        .json(jsonResponse.create(httpStatus.OK, bll.results({ page, pageSize })));
    } else {
      next();
    }
  },
  recentIntervals: async function(req, res, next) {
    next();
  },
  getCandidates: async function(req, res, next) {
    next();
  },
};
