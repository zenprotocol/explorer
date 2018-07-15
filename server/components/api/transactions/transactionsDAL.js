'use strict';

const dal = require('../../../lib/dal');

const transactionsDAL = dal.createDAL('Transaction');

transactionsDAL.findByHash = async function(hash) {
  return transactionsDAL.findOne({
    where: {
      hash,
    },
    include: [
      {
        model: this.db.Block
      },
      'Outputs',
      {
        model: this.db.Input,
        include: ['Output'],
      },
    ],
    order: [[transactionsDAL.db.Input, 'index'], [transactionsDAL.db.Output, 'index']],
  });
};

transactionsDAL.findAllByAddress = async function(address, asset) {
  return new Promise((resolve, reject) => {
    Promise.all([
      transactionsDAL.findAll({
        include: [
          {
            model: this.db.Output,
            where: {
              address,
              asset,
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
                  asset,
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

transactionsDAL.addInput = async function(transaction, input, options = {}) {
  return transaction.addInput(input, options);
};
transactionsDAL.addInput = transactionsDAL.addInput.bind(transactionsDAL);

transactionsDAL.addOutput = async function(transaction, output, options = {}) {
  return transaction.addOutput(output, options);
};
transactionsDAL.addOutput = transactionsDAL.addOutput.bind(transactionsDAL);

module.exports = transactionsDAL;
