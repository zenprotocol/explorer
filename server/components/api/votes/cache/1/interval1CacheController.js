'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../../../lib/jsonResponse');
const relevantData = require('./relevant.json');
const resultsData = require('./results.json');
const votesData = require('./votes.json');
const getChain = require('../../../../../lib/getChain');

/**
 * Loads the cached version of interval 1 (main net) which had a different structure
 */

module.exports = {
  index: async function(req, res, next) {
    const { interval, page = 0, pageSize = 10 } = req.query;
    const chain = await getChain();

    if (interval == 1 && chain === 'main') {
      const sliceParams = getSliceParamsFromPageParams({ page, pageSize });
      res
        .status(httpStatus.OK)
        .json(
          jsonResponse.create(httpStatus.OK, votesData.slice(sliceParams.start, sliceParams.end))
        );
    } else {
      next();
    }
  },
  relevantInterval: async function(req, res, next) {
    const { interval } = req.query;
    const chain = await getChain();

    if (interval == 1 && chain === 'main') {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, relevantData));
    } else {
      next();
    }
  },
  nextInterval: async function(req, res, next) {
    next();
  },
  currentOrNextInterval: async function(req, res, next) {
    next();
  },
  results: async function(req, res, next) {
    const { interval, page = 0, pageSize = 10 } = req.query;
    const chain = await getChain();

    if (interval == 1 && chain === 'main') {
      const sliceParams = getSliceParamsFromPageParams({ page, pageSize });
      res
        .status(httpStatus.OK)
        .json(
          jsonResponse.create(httpStatus.OK, resultsData.slice(sliceParams.start, sliceParams.end))
        );
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

function getSliceParamsFromPageParams({ page, pageSize } = {}) {
  return {
    start: page * pageSize,
    end: page * pageSize + Number(pageSize),
  };
}
