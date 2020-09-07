
export const voteStatus = {
  before: 1,
  during: 2,
  after: 3,
};

export function getVoteStatus({ currentBlock, beginBlock, endBlock } = {}) {
  return currentBlock < beginBlock
    ? voteStatus.before
    : currentBlock >= beginBlock && currentBlock < endBlock
    ? voteStatus.during
    : voteStatus.after;
}
