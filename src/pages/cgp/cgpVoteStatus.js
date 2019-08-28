
export const voteStatus = {
  before: 1,
  during: 2,
  after: 3,
};

export function getVoteStatus({ currentBlock, snapshot, tally } = {}) {
  return currentBlock <= snapshot
    ? voteStatus.before
    : currentBlock > snapshot && currentBlock <= tally
    ? voteStatus.during
    : voteStatus.after;
}
