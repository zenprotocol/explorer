'use strict';

const dal = require('../../../lib/dal');

const cgpIntervalDAL = dal.createDAL('CGPInterval');

cgpIntervalDAL.findByInterval = async function(interval) {
  return this.findOne({
    where: { interval },
  });
};

module.exports = cgpIntervalDAL;
