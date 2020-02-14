'use strict';

const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');

const voteIntervalsDAL = dal.createDAL('VoteInterval');
const Op = db.Sequelize.Op;

/**
 * Get all vote intervals that do not have a snapshot yet
 *
 * @param {number} height the height (blockNumber) to search until
 */
voteIntervalsDAL.findAllWithoutSnapshot = async function(height) {
  return this.findAll({
    where: {
      hasSnapshot: false,
      beginHeight: {
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
voteIntervalsDAL.findByIntervalAndPhase = async function(interval, phase) {
  return this.findOne({
    where: {
      interval,
      phase,
    },
  });
};

/**
 * Find the on-going interval
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findCurrent = async function(currentBlock) {
  return this.findOne({
    where: {
      [Op.and]: {
        beginHeight: {
          [Op.lte]: currentBlock,
        },
        endHeight: {
          [Op.gt]: currentBlock,
        },
      },
    },
    order: [['beginHeight', 'ASC']],
  });
};

/**
 * Find the previous interval
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findPrev = async function(currentBlock) {
  return this.findOne({
    where: {
      endHeight: {
        [Op.lte]: currentBlock,
      },
    },
    order: [['endHeight', 'DESC']],
  });
};

/**
 * Find the next interval
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findNext = async function(currentBlock) {
  return this.findOne({
    where: {
      beginHeight: {
        [Op.gt]: currentBlock,
      },
    },
    order: [['beginHeight', 'ASC']],
  });
};

/**
 * Find the on-going interval or the next one
 *
 * @param {number} currentBlock
 * @returns {VoteInterval}
 */
voteIntervalsDAL.findCurrentOrNext = async function(currentBlock) {
  return this.findOne({
    where: {
      endHeight: {
        [Op.gt]: currentBlock,
      },
    },
    order: [['beginHeight', 'ASC']],
  });
};

/**
 * Find all recent intervals up to the next one
 *
 * @param {number} currentBlock
 */
voteIntervalsDAL.findAllRecent = async function(currentBlock = 0) {
  const [prev, next] = await Promise.all([
    this.findAll({
      where: {
        beginHeight: {
          [Op.lte]: currentBlock, // including current
        },
      },
      order: [['beginHeight', 'DESC']],
    }),
    this.findAll({
      where: {
        beginHeight: {
          [Op.gt]: currentBlock,
        },
      },
      order: [['beginHeight', 'ASC']],
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
voteIntervalsDAL.setHasSnapshot = async function(id) {
  return this.update(id, { hasSnapshot: true });
};

module.exports = voteIntervalsDAL;
