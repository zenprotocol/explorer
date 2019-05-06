export const voteStatus = {
  none: 1,
  before: 2,
  during: 3,
  after: 4,
};

/**
 * Assume the server already take cares of sorting the intervals,
 * meaning currentInterval can contain only the current or previous interval
 * and nextInterval can contain only the next one
 */
export function getVoteStatus({ currentBlock, currentInterval = {}, nextInterval = {} } = {}) {
  // current exists
  if (currentInterval.beginHeight) {
    return currentBlock >= currentInterval.endHeight ? voteStatus.after : voteStatus.during;
  }
  // no current, next exists
  else if (nextInterval.beginHeight) {
    return voteStatus.before;
  }
  return voteStatus.none;
}
