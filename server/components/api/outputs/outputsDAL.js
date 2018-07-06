'use strict';

const dal = require('../../../lib/dal');

const outputsDAL = dal.createDAL('Output');

outputsDAL.findByTransaction = function(transactionId) {
  return this.findAll({
    where: {
      TransactionId: transactionId
    },
    order: [
      ['asset']
    ]
  });
};

module.exports = outputsDAL;