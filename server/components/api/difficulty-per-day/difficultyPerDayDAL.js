'use strict';

const dal = require('../../../lib/dal');

const difficultyPerDayDAL = dal.createDAL('DifficultyPerDay');

difficultyPerDayDAL.findLatest = function (options) {
  return this.findOne({
    order: [['date', 'DESC']],
    ...options,
  });
};

module.exports = difficultyPerDayDAL;
