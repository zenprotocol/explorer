'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addConstraint('Commands', ['TransactionId'], {
        type: 'foreign key',
        name: 'Commands_TransactionId_fkey',
        references: {
          table: 'Transactions',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Commands', ['ContractId'], {
        type: 'foreign key',
        name: 'Commands_ContractId_fkey',
        references: {
          table: 'Contracts',
          field: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'SET NULL',
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeConstraint('Commands', 'Commands_TransactionId_fkey'),
      queryInterface.removeConstraint('Commands', 'Commands_ContractId_fkey'),
    ]);
  },
};
