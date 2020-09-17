'use strict';

const dal = require('../../../lib/dal');

const txsPerDayDAL = dal.createDAL('TxsPerDay');

txsPerDayDAL.findLatest = function (options) {
  return this.findOne({
    order: [['date', 'DESC']],
    ...options,
  });
};

module.exports = txsPerDayDAL;
