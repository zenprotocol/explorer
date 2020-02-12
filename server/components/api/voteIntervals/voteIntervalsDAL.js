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
        [Op.lte]: height
      }
    }
  });
};

voteIntervalsDAL.findByIntervalAndPhase = async function(interval, phase) {
  return this.findOne({
    where: {
      interval,
      phase
    }
  });
};

voteIntervalsDAL.findCurrent = async function(currentBlock) {
  return this.findOne({
    where: {
      [Op.and]: {
        beginHeight: {
          [Op.lte]: currentBlock
        },
        endHeight: {
          [Op.gt]: currentBlock
        }
      }
    },
    order: [['beginHeight', 'ASC']]
  });
};

voteIntervalsDAL.findPrev = async function(currentBlock) {
  return this.findOne({
    where: {
      endHeight: {
        [Op.lte]: currentBlock
      }
    },
    order: [['endHeight', 'DESC']]
  });
};

voteIntervalsDAL.findNext = async function(currentBlock) {
  return this.findOne({
    where: {
      beginHeight: {
        [Op.gt]: currentBlock
      }
    },
    order: [['beginHeight', 'ASC']]
  });
};

/**
 * Find a few recent intervals
 *
 * @param {number} currentBlock
 */
voteIntervalsDAL.findAllRecent = async function({ limit, offset = 0 }) {
  return await this.findAll({
    limit,
    offset,
    order: [['beginHeight', 'ASC']]
  });
};

/**
 * Sets hasSnapshot to true
 * @param {number} id
 */
voteIntervalsDAL.setHasSnapshot = async function(id) {
  return this.update(id, { hasSnapshot: true });
};

module.exports = voteIntervalsDAL;
