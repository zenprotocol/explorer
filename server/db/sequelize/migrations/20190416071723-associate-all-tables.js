'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addConstraint('Transactions', {
        fields: ['BlockId'],
        type: 'foreign key',
        name: 'Transactions_BlockId_fkey',
        references: {
          table: 'Blocks',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Outputs', {
        fields: ['TransactionId'],
        type: 'foreign key',
        name: 'Outputs_TransactionId_fkey',
        references: {
          table: 'Transactions',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Inputs', {
        fields: ['TransactionId'],
        type: 'foreign key',
        name: 'Inputs_TransactionId_fkey',
        references: {
          table: 'Transactions',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Inputs', {
        fields: ['OutputId'],
        type: 'foreign key',
        name: 'Inputs_OutputId_fkey',
        references: {
          table: 'Outputs',
          field: 'id',
        },
        onDelete: 'set null',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Commands', {
        fields: ['TransactionId'],
        type: 'foreign key',
        name: 'Commands_TransactionId_fkey',
        references: {
          table: 'Transactions',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('Commands', {
        fields: ['ContractId'],
        type: 'foreign key',
        name: 'Commands_ContractId_fkey',
        references: {
          table: 'Contracts',
          field: 'id',
        },
        onDelete: 'set null',
        onUpdate: 'set null',
      }),
      queryInterface.addConstraint('ContractActivations', {
        fields: ['ContractId', 'TransactionId'],
        type: 'primary key',
        name: 'ContractActivations_pkey',
      }),
      queryInterface.addConstraint('ContractActivations', {
        fields: ['ContractId'],
        type: 'foreign key',
        name: 'ContractActivations_ContractId_fkey',
        references: {
          table: 'Contracts',
          field: 'id',
        },
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
      queryInterface.addConstraint('ContractActivations', {
        fields: ['TransactionId'],
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
      queryInterface.removeConstraint('Transactions', 'Transactions_BlockId_fkey'),
      queryInterface.removeConstraint('Outputs', 'Outputs_TransactionId_fkey'),
      queryInterface.removeConstraint('Inputs', 'Inputs_TransactionId_fkey'),
      queryInterface.removeConstraint('Inputs', 'Inputs_OutputId_fkey'),
      queryInterface.removeConstraint('Commands', 'Commands_TransactionId_fkey'),
      queryInterface.removeConstraint('Commands', 'Commands_ContractId_fkey'),
      queryInterface.removeConstraint('ContractActivations', 'ContractActivations_pkey'),
      queryInterface.removeConstraint('ContractActivations', 'ContractActivations_ContractId_fkey'),
      queryInterface.removeConstraint(
        'ContractActivations',
        'ContractActivations_TransactionId_fkey'
      ),
    ]);
  },
};
