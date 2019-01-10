'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addConstraint('ContractActivations', ['ContractId', 'TransactionId'], {
        type: 'primary key',
        name: 'ContractActivations_pkey',
      }),
      queryInterface.addConstraint('ContractActivations', ['ContractId'], {
        type: 'foreign key',
        name: 'ContractActivations_ContractId_fkey',
        references: {
          table: 'Contracts',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('ContractActivations', ['TransactionId'], {
        type: 'foreign key',
        name: 'ContractActivations_TransactionId_fkey',
        references: {
          table: 'Transactions',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeConstraint('ContractActivations', 'ContractActivations_pkey'),
      queryInterface.removeConstraint('ContractActivations', 'ContractActivations_ContractId_fkey'),
      queryInterface.removeConstraint('ContractActivations', 'ContractActivations_TransactionId_fkey'),
    ]);
  },
};
