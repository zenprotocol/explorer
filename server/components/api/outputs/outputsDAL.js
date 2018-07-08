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

outputsDAL.findAllByAddress = function(address) {
  return this.findAll({
    where: {
      address
    },
    include: [
      'Transaction'
    ],
    order: [
      ['createdAt', 'DESC']
    ]
  });
};

module.exports = outputsDAL;