'use strict';

const { getAllocationBallotContent, getPayoutBallotContent } = require('./getBallotContent');

function addBallotContentToResults({ type, chain } = {}) {
  return async function(results = []) {
    return Promise.all(results.map(addBallotContentToResult({ type, chain })));
  };
}

function addBallotContentToResult({ type, chain } = {}) {
  return async function(result = {}) {
    return result && result.ballot
      ? {
          ...result,
          content:
            type === 'payout'
              ? getPayoutBallotContent({ ballot: result.ballot, chain })
              : getAllocationBallotContent({ ballot: result.ballot }),
        }
      : result;
  };
}

module.exports = {
  addBallotContentToResults,
  addBallotContentToResult,
};
