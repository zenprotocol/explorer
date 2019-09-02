'use strict';

const { getAllocationBallotContent, getPayoutBallotContent } = require('./getBallotContent');

function addBallotContentToResults(type) {
  return async function(results = []) {
    return Promise.all(
      results.map(async item => ({
        ...item,
        content:
          type === 'payout'
            ? await getPayoutBallotContent(item)
            : await getAllocationBallotContent(item),
      }))
    );
  }
}

module.exports = addBallotContentToResults;
