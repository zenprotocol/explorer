'use strict';

const dal = require('../../../lib/dal');

const inputsDAL = dal.createDAL('Input');

inputsDAL.findAllByAddress = function(address, asset) {
  return this.findAll({
    attributes: {
      include: [
        [this.db.Sequelize.col('Transaction.hash'), 'txHash'],
        [this.db.Sequelize.col('Transaction->Block.timestamp'), 'blockTimestamp'],
      ],
    },
    include: [
      {
        model: this.db.Transaction,
        include: ['Block', {
          model: this.db.Output,
        }],
      },
      {
        model: this.db.Output,
        where: {
          address,
          asset
        },
      },
    ],
    order: [
      [this.db.Sequelize.col('Transaction->Block.timestamp'), 'DESC'],
      [this.db.Sequelize.col('Transaction->Outputs.index'), 'ASC'],
    ],
  });
};

inputsDAL.setOutput = async function(input, output, options = {}) {
  return input.setOutput(output, options);
};

module.exports = inputsDAL;
