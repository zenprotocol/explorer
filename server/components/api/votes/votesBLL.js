'use strict';

const votesDAL = require('./votesDAL');
const blocksDAL = require('../blocks/blocksDAL');
const voteIntervalsDAL = require('../voteIntervals/voteIntervalsDAL');
const createQueryObject = require('../../../lib/createQueryObject');

const AFTER_TALLY_BLOCKS = 10000; // number of blocks to show tally results

module.exports = {
  findIntervalAndTally: async function({ interval } = {}) {
    const currentBlock = await getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval(interval, currentBlock);

    if (!currentInterval) {
      return null;
    }

    const winner = await votesDAL.findWinner({ interval: currentInterval.interval });

    return {
      interval: currentInterval.interval,
      beginHeight: currentInterval ? currentInterval.beginHeight : null,
      endHeight: currentInterval ? currentInterval.endHeight : null,
      winner,
    };
  },
  findNextInterval: async function() {
    const currentBlock = await getCurrentBlockNumber();
    return voteIntervalsDAL.findNext(currentBlock);
  },
  findAllVotesByInterval: async function({ interval, page = 0, pageSize = 10, sorted } = {}) {
    const currentBlock = await getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval(interval, currentBlock);
    if (!currentInterval) {
      return null;
    }

    // this is currently ignored
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'blockNumber', desc: true }];

    const query = Object.assign(
      {},
      { interval: currentInterval.interval },
      createQueryObject({ page, pageSize, sorted: sortBy })
    );
    return await Promise.all([
      votesDAL.countByInterval({ interval: currentInterval.interval }),
      votesDAL.findAllByInterval(query),
    ]).then(votesDAL.getItemsAndCountResult);
  },
  findAllVoteResults: async function({ interval, page = 0, pageSize = 10 } = {}) {
    const currentBlock = await getCurrentBlockNumber();
    const currentInterval = await getCurrentInterval(interval, currentBlock);
    if (!currentInterval) {
      return null;
    }

    return await Promise.all([
      votesDAL.countAllVoteResults({ interval: currentInterval.interval }),
      votesDAL.findAllVoteResults(
        Object.assign(
          {},
          { interval: currentInterval.interval },
          createQueryObject({ page, pageSize })
        )
      ),
    ]).then(votesDAL.getItemsAndCountResult);
  },
  findRecentIntervals: async function() {
    const currentBlock = await getCurrentBlockNumber();
    return voteIntervalsDAL.findAllRecent(currentBlock);
  }
};

/**
 * Get a VoteInterval by:
 * 1. if interval is supplied, by that interval
 * 2. on going interval
 * 3. previous interval if currentBlock - prev.endHeight < 10,000
 * 4. next block
 */
async function getCurrentInterval(interval, currentBlock) {
  if (interval) {
    return voteIntervalsDAL.findByInterval(interval);
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
    : next;
}

async function getCurrentBlockNumber() {
  const latestBlock = await blocksDAL.findLatest();
  return latestBlock.blockNumber;
}
