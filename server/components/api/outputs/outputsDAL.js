'use strict';

const { Decimal } = require('decimal.js');
const dal = require('../../../lib/dal');

const outputsDAL = dal.createDAL('Output');

outputsDAL.findOutpoint = function (txHash, index) {
  return outputsDAL.findOne({
    where: {
      index,
    },
    include: [
      {
        model: outputsDAL.db.Tx,
        attributes: [],
        where: {
          hash: txHash,
        },
      },
    ],
  });
};

outputsDAL.searchByAmount = function (amount, limit = 10) {
  if (
    isNaN(Number(amount)) ||
    Number(amount) < 0 ||
    new Decimal(amount).abs().greaterThan('9223372036854775807') // reaching bigint limit
  ) {
    // above db integer
    return Promise.resolve([0, []]);
  }

  const where = {
    amount,
  };

  return Promise.all([
    this.count({ where }),
    this.findAll({
      where: {
        amount,
      },
      include: [
        {
          model: this.db.Tx,
          include: ['Block'],
        },
      ],
      limit,
      order: [['id', 'DESC']],
    }),
  ]);
};

module.exports = outputsDAL;
