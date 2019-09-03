'use strict';

const { getAllocationBallotContent, getPayoutBallotContent } = require('./getBallotContent');

function addBallotContentToResults(type) {
  return async function(results = []) {
    return Promise.all(results.map(addBallotContentToResult(type)));
  };
}

function addBallotContentToResult(type) {
  return async function(result = {}) {
    return result && result.ballot
      ? {
          ...result,
          content:
            type === 'payout'
              ? await getPayoutBallotContent(result)
              : await getAllocationBallotContent(result),
        }
      : result;
  };
}

module.exports = {
  addBallotContentToResults,
  addBallotContentToResult,
};
