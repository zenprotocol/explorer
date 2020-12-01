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
 * @param {('Contestant'|'Candidate')} phase
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
 * Find an interval which contains the given vote's block number
 * return only the interval at which the vote is valid
 * 
 * @param {number} blockNumber
 */
voteIntervalsDAL.findByVoteBlockNumber = async function (blockNumber) {
  return this.findOne({
    where: {
      beginBlock: {
        [Op.lt]: blockNumber,
      },
      endBlock: {
        [Op.gte]: blockNumber,
      },
    },
    order: [['beginBlock', 'ASC']],
  });
};

/**
 * Find the current on-going interval
 * returns interval if currentBlock is at beginBlock
 * do not use to validate votes
 * 
 * @param {number} currentBlock
 */
voteIntervalsDAL.findCurrent = async function (currentBlock) {
  return this.findOne({
    where: {
      beginBlock: {
        [Op.lte]: currentBlock,
      },
      endBlock: {
        [Op.gt]: currentBlock,
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
 * Find an interval by this order:
 * 1. current
 * 2. next interval if no on-going one
 * 3. past interval
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findCurrentNextOrPrev = async function (currentBlock) {
  return Promise.all([
    this.findPrev(currentBlock),
    this.findOne({
      where: {
        endBlock: {
          [Op.gte]: currentBlock,
        },
      },
      order: [['beginBlock', 'ASC']],
    }),
  ]).then(([prev, curOrNext]) => (curOrNext ? curOrNext : prev));
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
