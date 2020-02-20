'use strict';

const votesDAL = require('./votesDAL');
const blocksBLL = require('../blocks/blocksBLL');
const voteIntervalsDAL = require('../voteIntervals/voteIntervalsDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const config = require('../../../config/Config');

const configAfterTallyBlocks = config.get('governance:afterTallyBlocks');
// number of blocks to show tally results
const AFTER_TALLY_BLOCKS = configAfterTallyBlocks ? Number(configAfterTallyBlocks) : 1000;

module.exports = {
  findIntervalAndTally: async function({ interval, phase } = {}) {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval({
      interval,
      phase,
      currentBlock,
    });

    if (!currentInterval) {
      return null;
    }

    const _phase = phase || currentInterval.phase;

    const winnerPromise =
      _phase === 'Contestant'
        ? votesDAL.findContestantWinners({
            interval: currentInterval.interval,
          })
        : votesDAL.findCandidateWinner({
            interval: currentInterval.interval,
          });

    const candidatesPromise = votesDAL.findContestantWinners({
      interval: currentInterval.interval,
    });

    const [winner, candidates] = await Promise.all([winnerPromise, candidatesPromise]);
    return {
      interval: currentInterval.interval,
      phase: currentInterval.phase,
      beginHeight: currentInterval ? currentInterval.beginHeight : null,
      endHeight: currentInterval ? currentInterval.endHeight : null,
      thresholdZp: currentInterval.thresholdZp,
      winner,
      candidates,
    };
  },
  findNextInterval: async function() {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    return voteIntervalsDAL.findNext(currentBlock);
  },
  findCurrentOrNextInterval: async function() {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    return voteIntervalsDAL.findCurrentOrNext(currentBlock);
  },
  findAllVotesByInterval: async function({
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

    // this is currently ignored
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'blockNumber', desc: true }];

    const query = Object.assign(
      {},
      {
        interval: currentInterval.interval,
        phase: phase || currentInterval.phase,
      },
      createQueryObject({ page, pageSize, sorted: sortBy })
    );
    return await Promise.all([
      votesDAL.countByInterval({
        interval: currentInterval.interval,
        phase: phase || currentInterval.phase,
      }),
      votesDAL.findAllByInterval(query),
    ]).then(votesDAL.getItemsAndCountResult);
  },
  findAllVoteResults: async function({ interval, phase, page = 0, pageSize = 10 } = {}) {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval({
      interval,
      phase,
      currentBlock,
    });
    if (!currentInterval) {
      return null;
    }

    return await Promise.all([
      votesDAL.countAllVoteResults({
        interval: currentInterval.interval,
        phase: phase || currentInterval.phase,
      }),
      votesDAL.findAllVoteResults(
        Object.assign(
          {},
          {
            interval: currentInterval.interval,
            phase: phase || currentInterval.phase,
          },
          createQueryObject({ page, pageSize })
        )
      ),
    ]).then(votesDAL.getItemsAndCountResult);
  },
  findRecentIntervals: async function() {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    return voteIntervalsDAL.findAllRecent(currentBlock);
  },
  findContestantWinners: async function({ interval } = {}) {
    const currentBlock = await blocksBLL.getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval({
      interval,
      phase: 'Contestant',
      currentBlock,
    });
    if (!currentInterval) {
      return null;
    }

    return votesDAL.findContestantWinners({
      interval: currentInterval.interval,
    });
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
    return voteIntervalsDAL.findByIntervalAndPhase(interval, phase);
  }

  const [current, next, prev] = await Promise.all([
    voteIntervalsDAL.findCurrent(currentBlock),
    voteIntervalsDAL.findNext(currentBlock),
    voteIntervalsDAL.findPrev(currentBlock),
  ]);

  return current
    ? current
    : prev && currentBlock - prev.endHeight < AFTER_TALLY_BLOCKS
    ? prev
    : !next && prev
    ? prev
    : next;
}
