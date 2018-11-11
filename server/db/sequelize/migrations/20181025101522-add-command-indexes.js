'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addConstraint('Commands', ['TransactionId', 'indexInTransaction'], {
        type: 'unique',
        name: 'Commands_TransactionId_indexInTransaction_unique_constraint',
      }),
      queryInterface.addIndex('Commands', {
        fields: ['TransactionId'],
        unique: false,
        name: 'Commands_TransactionId_index',
      }),
      queryInterface.addIndex('Commands', {
        fields: ['ContractId'],
        unique: false,
        name: 'Commands_ContractId_index',
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeConstraint(
        'Commands',
        'Commands_TransactionId_indexInTransaction_unique_constraint'
      ),
      queryInterface.removeIndex('Commands', 'Commands_TransactionId_index'),
      queryInterface.removeIndex('Commands', 'Commands_ContractId_index'),
    ]);
  },
};
