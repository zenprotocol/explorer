const R = require('ramda');
const { Decimal } = require('decimal.js');

/**
 * Calculate the winner by a weighted median, as calculated in the node
 *
 * @param {[{content: {allocation: number}, zpAmount: number}]} voteResults
 * @returns {number} the winner allocation or null if no votes
 */
function weightedMedian(voteResults) {
  if (!voteResults || !voteResults.length) {
    return null;
  }

  const numOfVotes = voteResults.length;

  const sortedVotes = R.sort(
    (a, b) => new Decimal(a.content.allocation).minus(b.content.allocation).toNumber(),
    voteResults
  );
  const weights = sortedVotes.map(v => new Decimal(v.zpAmount));
  const totalWeight = R.reduce((acc, elem) => acc.add(elem), new Decimal(0), weights);

  // acc sum
  const weightsBefore = R.prepend(
    new Decimal(0),
    R.mapAccum((acc, val) => [acc.add(val), acc.add(val)], new Decimal(0), weights)[1]
  );
  const weightsAfter = R.mapAccum(
    (acc, val) => [acc.minus(val), acc.minus(val)],
    totalWeight,
    weights
  )[1];

  const zero = { content: { allocation: 0 }, zpAmount: 0 };
  // find low and high
  const low =
    sortedVotes.find(
      (_, index) =>
        weightsBefore[index].lessThanOrEqualTo(totalWeight.dividedBy(2)) &&
        weightsAfter[index].lessThanOrEqualTo(totalWeight.dividedBy(2))
    ) || zero;
  const high =
    R.reverse(sortedVotes).find(
      (_, index) =>
        weightsBefore[numOfVotes - 1 - index].lessThanOrEqualTo(totalWeight.dividedBy(2)) &&
        weightsAfter[numOfVotes - 1 - index].lessThanOrEqualTo(totalWeight.dividedBy(2))
    ) || zero;

  const l = new Decimal(low.content.allocation);
  const wl = new Decimal(low.zpAmount);
  const h = new Decimal(high.content.allocation);
  const wh = new Decimal(high.zpAmount);

  return l
    .times(wl)
    .add(h.times(wh))
    .dividedBy(wl.add(wh))
    .floor()
    .toNumber();
}

module.exports = weightedMedian;
