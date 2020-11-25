
export const voteStatus = {
  before: 1,
  during: 2,
  after: 3,
};

/**
 * Vote opens on the client at snapshot block (1 block before allowed vote)
 * This is done to alert the user that the vote has been opened and he can now vote
 * Votes will appear as of SNAPSHOT + 1
 */
export function getVoteStatus({ currentBlock, beginBlock, endBlock } = {}) {
  return currentBlock < beginBlock
    ? voteStatus.before
    : currentBlock >= beginBlock && currentBlock < endBlock
    ? voteStatus.during
    : voteStatus.after;
}
