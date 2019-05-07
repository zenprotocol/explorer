
export const voteStatus = {
  before: 1,
  during: 2,
  after: 3,
};

export function getVoteStatus({ currentBlock, beginHeight, endHeight } = {}) {
  return currentBlock < beginHeight
    ? voteStatus.before
    : currentBlock >= beginHeight && currentBlock < endHeight
    ? voteStatus.during
    : voteStatus.after;
}
