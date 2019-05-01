'use strict';

const votesDAL = require('./votesDAL');
const voteIntervalsDAL = require('../voteIntervals/voteIntervalsDAL');
const infosBLL = require('../infos/infosBLL');
const createQueryObject = require('../../../lib/createQueryObject');

module.exports = {
  findIntervalAndTally: async function({ interval } = {}) {
    const [currentBlock, currentInterval] = await Promise.all([
      infosBLL.findByName({ name: 'blocks' }),
      voteIntervalsDAL.findByIntervalOrCurrent(interval),
    ]);

    if (!currentInterval) {
      return null;
    }

    const voteResult = await votesDAL.getVoteResults(currentInterval.interval);

    return {
      interval: currentInterval.interval,
      currentBlock: Number(currentBlock.value),
      beginHeight: currentInterval ? currentInterval.beginHeight : null,
      endHeight: currentInterval ? currentInterval.endHeight : null,
      tally: voteResult,
    };
  },
  findAllVotesByInterval: async function({ interval, page = 0, pageSize = 10, sorted } = {}) {
    const currentInterval = await voteIntervalsDAL.findByIntervalOrCurrent(interval);
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
};
