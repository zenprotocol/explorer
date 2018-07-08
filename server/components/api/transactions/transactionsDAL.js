'use strict';

const dal = require('../../../lib/dal');

const transactionsDAL = dal.createDAL('Transaction');

transactionsDAL.findByHash = async function(hash) {
  return transactionsDAL.findOne({
    where: {
      hash,
    },
    include: [
      'Outputs',
      {
        model: this.db.Input,
        include: ['Output'],
      },
    ],
    order: [[transactionsDAL.db.Input, 'index'], [transactionsDAL.db.Output, 'index']],
  });
};

transactionsDAL.findAllByAddress = async function(address) {
  return new Promise((resolve, reject) => {
    Promise.all([
      transactionsDAL.findAll({
        include: [
          {
            model: this.db.Output,
            where: {
              address,
            },
          },
        ],
        order: [[transactionsDAL.db.Output, 'index']],
      }),
      transactionsDAL.findAll({
        include: [
          {
            model: this.db.Input,
            include: [
              {
                model: this.db.Output,
                where: {
                  address,
                },
              },
            ],
          },
        ],
        order: [[transactionsDAL.db.Input, 'index']],
      })
    ])
      .then(values => {
        const [txOutputs, txInputs] = values;
        resolve([...txOutputs, ...txInputs]);
      })
      .catch(reject);
  });
};

transactionsDAL.addInput = async function(transaction, input) {
  return transaction.addInput(input);
};
transactionsDAL.addInput = transactionsDAL.addInput.bind(transactionsDAL);

transactionsDAL.addOutput = async function(transaction, output) {
  return transaction.addOutput(output);
};
transactionsDAL.addOutput = transactionsDAL.addOutput.bind(transactionsDAL);

module.exports = transactionsDAL;
