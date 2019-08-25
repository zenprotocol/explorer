'use strict';

const dal = require('../../../lib/dal');
const db = require('../../../../server/db/sequelize/models');

const snapshotsDAL = dal.createDAL('Snapshot');

snapshotsDAL.findAllHeights = async function() {
  return this.findAll({
    attributes: ['height'],
    group: ['height'],
    order: [['height', 'ASC']],
  }).then(results => {
    // return the heights without a wrapping object
    return results.map(item => item.height);
  });
};

module.exports = snapshotsDAL;
