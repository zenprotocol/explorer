'use strict';

const dal = require('../../../lib/dal');

const zpSupplyPerDayDAL = dal.createDAL('ZpSupplyPerDay');

zpSupplyPerDayDAL.findLatest = function (options) {
  return this.findOne({
    order: [['date', 'DESC']],
    ...options,
  });
};

module.exports = zpSupplyPerDayDAL;
