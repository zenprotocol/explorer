'use strict';

const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');
const infosBLL = require('../infos/infosBLL');

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
 * Find a vote interval by the interval number or get the current one
 * current one is by importance: current, next or lastly previous interval
 *
 * @param {number} interval
 */
voteIntervalsDAL.findByIntervalOrCurrent = async function(interval) {
  if (interval) {
    return this.findOne({
      where: {
        interval,
      },
    });
  } else {
    // find either the current or the next interval
    const infoBlocks = await infosBLL.findByName({ name: 'blocks' });
    const currentBlock = Number(infoBlocks.value);

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
    const nextPromise = this.findOne({
      where: {
        beginHeight: {
          [Op.gt]: currentBlock,
        },
      },
      order: [['beginHeight', 'ASC']],
    });
    const [prev, current, next] = await Promise.all([prevPromise, currentPromise, nextPromise]);
    return current ? current : next ? next : prev;
  }
};

/**
 * Sets hasSnapshot to true
 * @param {number} id
 */
voteIntervalsDAL.setHasSnapshot = async function(id) {
  return this.update(id, { hasSnapshot: true });
};

module.exports = voteIntervalsDAL;
