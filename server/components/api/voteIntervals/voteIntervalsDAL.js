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
 * Sets hasSnapshot to true
 * @param {number} id
 */
voteIntervalsDAL.setHasSnapshot = async function(id) {
  return this.update(id, { hasSnapshot: true });
};

module.exports = voteIntervalsDAL;
