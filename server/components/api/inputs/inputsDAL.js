'use strict';

const dal = require('../../../lib/dal');

const inputsDAL = dal.createDAL('Input');

inputsDAL.findAllByAddress = function(address) {
  return this.findAll({
    include: [
      'Transaction',
      {
        model: this.db.Output,
        where: {
          address,
        },
      },
    ],
    order: [['createdAt', 'DESC']],
  });
};

inputsDAL.setOutput = async function(input, output) {
  return input.setOutput(output);
};
inputsDAL.setOutput = inputsDAL.setOutput.bind(inputsDAL);

module.exports = inputsDAL;
