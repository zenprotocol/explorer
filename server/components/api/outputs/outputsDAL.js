'use strict';

const dal = require('../../../lib/dal');

const outputsDAL = dal.createDAL('Output');

outputsDAL.findOutpoint = function(txHash, index) {
  return outputsDAL.findOne({
    where: {
      index,
    },
    include: [
      {
        model: outputsDAL.db.Transaction,
        attributes: [],
        where: {
          hash: txHash,
        },
      },
    ],
  });
};

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

outputsDAL.searchByAmount = function(amount, limit = 10) {
  if (
    isNaN(Number(amount)) ||
    Number(amount) < 0 ||
    String(amount).length > 18 // reaching bigint limit
  ) {
    // above db integer
    return Promise.resolve([0, []]);
  }

  const where = {
    amount,
  };

  return Promise.all([
    this.count({where}),
    this.findAll({
      where: {
        amount,
      },
      include: [
        {
          model: this.db.Transaction,
          include: ['Block']
        }
      ],
      limit,
      order: [['id', 'DESC']],
    })
  ]);
};

module.exports = outputsDAL;
