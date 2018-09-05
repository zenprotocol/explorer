'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addIndex('Transactions', {
        fields: ['BlockId'],
        unique: false,
        name: 'Transactions_BlockId_index',
      }),
      queryInterface.addIndex('Outputs', {
        fields: ['TransactionId'],
        unique: false,
        name: 'Outputs_TransactionId_index',
      }),
      queryInterface.addIndex('Inputs', {
        fields: ['TransactionId'],
        unique: false,
        name: 'Inputs_TransactionId_index',
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeIndex('Transactions', 'Transactions_BlockId_index'),
      queryInterface.removeIndex('Outputs', 'Outputs_TransactionId_index'),
      queryInterface.removeIndex('Inputs', 'Inputs_TransactionId_index'),
    ]);
  },
};
