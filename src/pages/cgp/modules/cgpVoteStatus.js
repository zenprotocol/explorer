import getPhaseBlocks from './getPhaseBlocks';

export const voteStatus = {
  before: 1,
  during: 2,
  after: 3,
};

export function getVoteStatus({ currentBlock, snapshot, tally, phase } = {}) {
  const phaseBlocks = getPhaseBlocks({phase, snapshot, tally});
  return currentBlock <= phaseBlocks.snapshot
    ? voteStatus.before
    : currentBlock <= phaseBlocks.tally
    ? voteStatus.during
    : voteStatus.after;
}
