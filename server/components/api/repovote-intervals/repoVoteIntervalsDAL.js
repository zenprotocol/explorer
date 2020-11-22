'use strict';

const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');

const voteIntervalsDAL = dal.createDAL('RepoVoteInterval');
const Op = db.Sequelize.Op;

/**
 * Get all vote intervals that do not have a snapshot yet
 *
 * @param {number} height the height (blockNumber) to search until
 */
voteIntervalsDAL.findAllWithoutSnapshot = async function (height) {
  return this.findAll({
    where: {
      hasSnapshot: false,
      beginBlock: {
        [Op.lte]: height,
      },
    },
  });
};

/**
 * Find a specific voteInterval
 *
 * @param {number} interval
 * @param {(Contestant|Candidate)} phase
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findByIntervalAndPhase = async function (interval, phase) {
  return this.findOne({
    where: {
      interval,
      phase,
    },
  });
};

/**
 * Find an interval which contains the given block number
 * @param {number} blockNumber
 */
voteIntervalsDAL.findByBlockNumber = async function (blockNumber) {
  return this.findOne({
    where: {
      beginBlock: {
        [Op.lte]: blockNumber,
      },
      endBlock: {
        [Op.gt]: blockNumber,
      },
    },
  });
};

/**
 * Find the on-going interval
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findCurrent = async function (currentBlock) {
  return this.findOne({
    where: {
      [Op.and]: {
        beginBlock: {
          [Op.lte]: currentBlock,
        },
        endBlock: {
          [Op.gt]: currentBlock,
        },
      },
    },
    order: [['beginBlock', 'ASC']],
  });
};

/**
 * Find the previous interval
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findPrev = async function (currentBlock) {
  return this.findOne({
    where: {
      endBlock: {
        [Op.lte]: currentBlock,
      },
    },
    order: [['endBlock', 'DESC']],
  });
};

/**
 * Find the next interval
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findNext = async function (currentBlock) {
  return this.findOne({
    where: {
      beginBlock: {
        [Op.gt]: currentBlock,
      },
    },
    order: [['beginBlock', 'ASC']],
  });
};

/**
 * Find an interval by interval number and phase
 *
 * @param {number} interval
 * @param {string} phase
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findInterval = async function (interval = 0, phase = '') {
  return this.findOne({
    where: {
      interval,
      phase
    },
  });
};

/**
 * Find the on-going interval or the next one
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findCurrentOrNext = async function (currentBlock) {
  return this.findOne({
    where: {
      endBlock: {
        [Op.gt]: currentBlock,
      },
    },
    order: [['beginBlock', 'ASC']],
  });
};

/**
 * Find all recent intervals up to the next one
 *
 * @param {number} currentBlock
 */
voteIntervalsDAL.findAllRecent = async function (currentBlock = 0) {
  const [prev, next] = await Promise.all([
    this.findAll({
      where: {
        beginBlock: {
          [Op.lte]: currentBlock, // including current
        },
      },
      order: [['beginBlock', 'DESC']],
    }),
    this.findAll({
      where: {
        beginBlock: {
          [Op.gt]: currentBlock,
        },
      },
      order: [['beginBlock', 'ASC']],
      limit: 3,
    }),
  ]);

  const intervals = [];
  // order should be new to old
  intervals.push.apply(intervals, next.reverse());
  intervals.push.apply(intervals, prev);
  if (intervals.length > 2 && intervals[0].phase === 'Contestant') {
    intervals.shift();
  }
  return intervals;
};

/**
 * Sets hasSnapshot to true
 * @param {number} id
 */
voteIntervalsDAL.setHasSnapshot = async function (id) {
  return this.update(id, { hasSnapshot: true });
};

module.exports = voteIntervalsDAL;
