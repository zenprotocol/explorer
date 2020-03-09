'use strict';

const relevantData = require('./relevant.json');
const resultsData = require('./results.json');
const votesData = require('./votes.json');

/**
 * Get data from the cached files in this folder
 */

module.exports = {
  votes: function({ page, pageSize } = {}) {
    const sliceParams = getSliceParamsFromPageParams({ page, pageSize });

    return {
      items: votesData.slice(sliceParams.start, sliceParams.end),
      count: votesData.length,
    };
  },
  relevantInterval: function() {
    return relevantData;
  },
  nextInterval: function(req, res, next) {
    next();
  },
  currentOrNextInterval: function(req, res, next) {
    next();
  },
  results: function({ page, pageSize } = {}) {
    const sliceParams = getSliceParamsFromPageParams({ page, pageSize });

    return {
      items: resultsData.slice(sliceParams.start, sliceParams.end),
      count: resultsData.length,
    };
  },
  recentIntervals: function(req, res, next) {
    next();
  },
  getCandidates: function(req, res, next) {
    next();
  },
};

function getSliceParamsFromPageParams({ page, pageSize } = {}) {
  return {
    start: page * pageSize,
    end: page * pageSize + Number(pageSize),
  };
}
