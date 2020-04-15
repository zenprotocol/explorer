import getPhaseBlocks from './getPhaseBlocks';

export const voteStatus = {
  before: 1,
  during: 2,
  after: 3,
};

export function getVoteStatus({ currentBlock, snapshot, tally, phase } = {}) {
  const phaseBlocks = getPhaseBlocks({ phase, snapshot, tally });
  return currentBlock < phaseBlocks.snapshot
    ? voteStatus.before
    : currentBlock < phaseBlocks.tally
    ? voteStatus.during
    : voteStatus.after;
}

/**
 * Example:
 * interval 1 90-100
 * block 89 - before
 * block 90 - nomination begins now - show during
 * block 94 - still nomination
 * block 95 - (if people vote now, it adds to 96, Voting phase) - voting phase begins now, show during
 * block 100 - after - block 100 is the tally and it already exists, we can know the winner
 */
