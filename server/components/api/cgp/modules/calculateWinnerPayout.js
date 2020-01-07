const R = require('ramda');
const { Decimal } = require('decimal.js');

/**
 * for efficiency, pass the ordered vote results (descending) and only the first 2 results
 *
 * @param {[{zpAmount: number}]} voteResults
 * @returns {Object} the winner payout or null in case of a tie
 */
function calculateWinnerPayout(voteResults) {
  if (!voteResults || !voteResults.length) {
    return null;
  }

  if (voteResults.length === 1) {
    return voteResults[0];
  }

  const sortedVotesDesc = R.sort((a, b) => new Decimal(b.zpAmount).minus(a.zpAmount).toNumber(), voteResults);
  return new Decimal(sortedVotesDesc[0].zpAmount).equals(sortedVotesDesc[1].zpAmount)
    ? null
    : sortedVotesDesc[0];
}

module.exports = calculateWinnerPayout;
