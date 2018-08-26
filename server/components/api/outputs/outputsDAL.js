'use strict';

const dal = require('../../../lib/dal');

const outputsDAL = dal.createDAL('Output');

outputsDAL.findByTransaction = function(transactionId) {
  return this.findAll({
    where: {
      TransactionId: transactionId,
    },
    order: [['asset']],
  });
};

outputsDAL.findAllByAddress = function(address, asset) {
  return this.findAll({
    attributes: {
      include: [
        [this.db.Sequelize.col('Transaction->Block.timestamp'), 'blockTimestamp'],
      ],
    },
    where: {
      address,
      asset,
    },
    include: [
      {
        model: this.db.Transaction,
        include: ['Block', {
          model: this.db.Input,
          include: [{
            model: this.db.Output,
            where: {
              asset,
            },
          }]
        }],
      },
    ],
    order: [[this.db.Sequelize.col('Transaction->Block.timestamp'), 'DESC']],
  });
};

outputsDAL.findAllAddressAssets = function(address) {
  return this.findAll({
    attributes: ['asset'],
    where: {
      address,
    },
    group: ['asset']
  });
};

module.exports = outputsDAL;
