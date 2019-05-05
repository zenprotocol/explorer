'use strict';

const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');
const blocksDAL = require('../blocks/blocksDAL');

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

voteIntervalsDAL.findByInterval = async function(interval) {
  return this.findOne({
    where: {
      interval,
    },
  });
};

voteIntervalsDAL.findCurrentOrPrev = async function() {
  const currentBlock = await getCurrentBlockNumber();

  const prevPromise = this.findOne({
    where: {
      [Op.and]: {
        endHeight: {
          [Op.lt]: currentBlock,
        },
      },
    },
    order: [['endHeight', 'DESC']],
  });
  const currentPromise = this.findOne({
    where: {
      [Op.and]: {
        beginHeight: {
          [Op.lte]: currentBlock,
        },
        endHeight: {
          [Op.gte]: currentBlock,
        },
      },
    },
    order: [['beginHeight', 'ASC']],
  });
  const [current, prev] = await Promise.all([currentPromise, prevPromise]);
  return current ? current : prev;
};

voteIntervalsDAL.findNext = async function() {
  const currentBlock = await await getCurrentBlockNumber();

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
 * Sets hasSnapshot to true
 * @param {number} id
 */
voteIntervalsDAL.setHasSnapshot = async function(id) {
  return this.update(id, { hasSnapshot: true });
};

async function getCurrentBlockNumber() {
  const latestBlock = await blocksDAL.findLatest();
  return latestBlock.blockNumber;
}

module.exports = voteIntervalsDAL;
