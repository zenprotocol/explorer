'use strict';

const votesDAL = require('./repoVotesDAL');
const blocksBLL = require('../blocks/blocksBLL');
const intervalsDAL = require('../repovote-intervals/repoVoteIntervalsDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const getChain = require('../../../lib/getChain');
const config = require('../../../config/Config');

const configAfterTallyBlocks = config.get('governance:afterTallyBlocks');
const configDefaultCommitId = config.get('governance:defaultCommitId');
// number of blocks to show tally results
const AFTER_TALLY_BLOCKS = configAfterTallyBlocks ? Number(configAfterTallyBlocks) : 1000;

module.exports = {
  findIntervalAndTally: async function ({ interval, phase } = {}) {
    const [currentBlock, chain] = await Promise.all([
      blocksBLL.getCurrentBlockNumber(),
      getChain(),
    ]);
    const configCoinbaseMaturity = config.get(`coinbaseMaturity:${chain}`);
    const currentInterval = await getCurrentInterval({
      interval,
      phase,
      currentBlock,
    });

    if (!currentInterval) {
      return null;
    }

    const [contestantInterval, candidateInterval] = await Promise.all([
      intervalsDAL.findByIntervalAndPhase(currentInterval.interval, 'Contestant'),
      intervalsDAL.findByIntervalAndPhase(currentInterval.interval, 'Candidate'),
    ]);

    const contestantWinnersPromise = votesDAL.findContestantWinners({
      beginBlock: contestantInterval.beginBlock,
      endBlock: contestantInterval.endBlock,
      threshold: contestantInterval.threshold,
    });
    const candidateWinnerPromise = votesDAL.findCandidateWinner({
      beginBlock: candidateInterval.beginBlock,
      endBlock: candidateInterval.endBlock,
    });
    const zpParticipatedPromise = votesDAL.findZpParticipated({
      beginBlock: currentInterval.beginBlock,
      endBlock: currentInterval.endBlock,
    });

    const winnerPromise =
      currentInterval.phase === 'Contestant' ? contestantWinnersPromise : candidateWinnerPromise;

    const candidatesPromise =
      currentInterval.phase === 'Candidate'
        ? Promise.all([
            contestantWinnersPromise.then(addDefaultCommitId),
            votesDAL.findAllVoteResults(currentInterval),
          ]).then(([contestantWinners, currentResults]) =>
            // combine contestant winners with the current amount from the current results
            contestantWinners.map((contestant) => {
              const matchingResult = currentResults.find(
                (result) => result.commitId === contestant.commitId
              ) || { amount: '0', zpAmount: '0' };

              return {
                ...contestant,
                amount: matchingResult.amount,
                zpAmount: matchingResult.zpAmount,
              };
            })
          )
        : Promise.resolve([]);

    const [winner, candidates, zpParticipated] = await Promise.all([
      winnerPromise,
      candidatesPromise,
      zpParticipatedPromise,
    ]);
    return {
      interval: currentInterval.interval,
      phase: currentInterval.phase,
      beginBlock: currentInterval.beginBlock,
      endBlock: currentInterval.endBlock,
      threshold: currentInterval.threshold,
      zpParticipated,
      coinbaseMaturity: currentInterval.endBlock + configCoinbaseMaturity,
      winner,
      candidates,
    };
  },
  findNextInterval: async function () {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    return intervalsDAL.findNext(currentBlock);
  },
  findPrevInterval: async function () {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    return intervalsDAL.findPrev(currentBlock);
  },
  findInterval: async function ({ interval, phase }) {
    return intervalsDAL.findByIntervalAndPhase(interval, phase);
  },
  currentNextOrPrev: async function () {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    return intervalsDAL.findCurrentNextOrPrev(currentBlock);
  },
  findAllVotesByInterval: async function ({
    interval,
    phase,
    page = 0,
    pageSize = 10,
    sorted,
  } = {}) {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval({
      interval,
      phase,
      currentBlock,
    });
    if (!currentInterval) {
      return null;
    }
    const { beginBlock, endBlock } = currentInterval;

    // this is currently ignored
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'blockNumber', desc: true }];

    const query = Object.assign(
      {},
      {
        beginBlock,
        endBlock,
      },
      createQueryObject({ page, pageSize, sorted: sortBy })
    );
    return await Promise.all([
      votesDAL.countByInterval({
        beginBlock,
        endBlock,
      }),
      votesDAL.findAllByInterval(query),
    ]).then(votesDAL.getItemsAndCountResult);
  },
  findAllVoteResults: async function ({ interval, phase, page = 0, pageSize = 10 } = {}) {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval({
      interval,
      phase,
      currentBlock,
    });
    if (!currentInterval) {
      return null;
    }
    const { beginBlock, endBlock } = currentInterval;

    return await Promise.all([
      votesDAL.countAllVoteResults({
        beginBlock,
        endBlock,
      }),
      votesDAL.findAllVoteResults(
        Object.assign(
          {},
          {
            beginBlock,
            endBlock,
          },
          createQueryObject({ page, pageSize })
        )
      ),
    ]).then(votesDAL.getItemsAndCountResult);
  },
  findRecentIntervals: async function () {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    return intervalsDAL.findAllRecent(currentBlock);
  },
  findContestantWinners: async function ({ interval } = {}) {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval({
      interval,
      phase: 'Contestant',
      currentBlock,
    });
    if (!currentInterval) {
      return null;
    }

    return votesDAL
      .findContestantWinners({
        beginBlock: currentInterval.beginBlock,
        endBlock: currentInterval.endBlock,
        threshold: currentInterval.threshold,
      })
      .then(addDefaultCommitId);
  },
};

/**
 * Get a VoteInterval by:
 * 1. if interval is supplied, by that interval
 * 2. on going interval
 * 3. previous interval if in AFTER_TALLY_BLOCKS
 * 4. previous interval if next does not exist
 * 4. next block
 */
async function getCurrentInterval({ interval, phase, currentBlock } = {}) {
  if (interval && phase) {
    return intervalsDAL.findByIntervalAndPhase(interval, phase);
  }

  const [current, next, prev] = await Promise.all([
    intervalsDAL.findCurrent(currentBlock),
    intervalsDAL.findNext(currentBlock),
    intervalsDAL.findPrev(currentBlock),
  ]);

  return current
    ? current
    : prev && currentBlock - prev.endBlock < AFTER_TALLY_BLOCKS
    ? prev
    : !next && prev
    ? prev
    : next;
}

/**
 * Add the default commit id to the list if it does not exist
 */
function addDefaultCommitId(candidates = []) {
  return candidates.some((candidate) => candidate.commitId === configDefaultCommitId)
    ? candidates
    : [{ commitId: configDefaultCommitId, amount: '0', zpAmount: '0' }, ...candidates];
}
