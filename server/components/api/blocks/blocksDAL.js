'use strict';

const dal = require('../../../lib/dal');

const blocksDAL = dal.createDAL('Block');

blocksDAL.findLatest = function (amount = 1) {
  return this.findAll({
    order: [
      ['createdAt', 'DESC']
    ],
    limit: amount
  });
};
blocksDAL.findLatest = blocksDAL.findLatest.bind(blocksDAL);

module.exports = blocksDAL;