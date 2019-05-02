export const voteStatus = {
  before: 1,
  during: 2,
  after: 3,
};

export function getVoteStatus({ currentBlock, beginHeight, endHeight } = {}) {
  if(currentBlock < beginHeight) return voteStatus.before;
  if(currentBlock >= beginHeight && currentBlock < endHeight) return voteStatus.during;
  return voteStatus.after;
}