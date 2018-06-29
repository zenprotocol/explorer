'use strict';

const dal = require('../../../lib/dal');

const transactionsDAL = dal.createDAL('Transaction');

transactionsDAL.addInput = async function(transaction, input) {
  return transaction.addInput(input);
};
transactionsDAL.addInput = transactionsDAL.addInput.bind(transactionsDAL);

transactionsDAL.addOutput = async function(transaction, output) {
  return transaction.addOutput(output);
};
transactionsDAL.addOutput = transactionsDAL.addOutput.bind(transactionsDAL);

module.exports = transactionsDAL;