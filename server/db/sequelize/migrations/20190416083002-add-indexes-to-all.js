'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addIndex('Blocks', {
        fields: ['blockNumber'],
        unique: true,
        name: 'Blocks_blockNumber_index',
      }),
      queryInterface.addIndex('Blocks', {
        fields: ['hash'],
        unique: true,
        name: 'Blocks_hash_index',
      }),
      queryInterface.addIndex('Transactions', {
        fields: ['hash'],
        unique: true,
        name: 'Transactions_hash_index',
      }),
      queryInterface.addIndex('Transactions', {
        fields: ['BlockId'],
        unique: false,
        name: 'Transactions_BlockId_index',
      }),
      queryInterface.addIndex('Outputs', {
        fields: [Sequelize.literal('"address" varchar_pattern_ops')], // POSTGRES OPTIMIZATION!
        unique: false,
        name: 'Outputs_address_index',
      }),
      queryInterface.addIndex('Outputs', {
        fields: [Sequelize.literal('"asset" varchar_pattern_ops')], // POSTGRES OPTIMIZATION!
        unique: false,
        name: 'Outputs_asset_index',
      }),
      queryInterface.addIndex('Outputs', {
        fields: ['lockType'],
        unique: false,
        name: 'Outputs_lockType_index',
      }),
      queryInterface.addIndex('Outputs', {
        fields: ['TransactionId'],
        unique: false,
        name: 'Outputs_TransactionId_index',
      }),
      queryInterface.addIndex('Inputs', {
        fields: ['OutputId'],
        unique: false,
        name: 'Inputs_OutputId_index',
      }),
      queryInterface.addIndex('Inputs', {
        fields: ['TransactionId'],
        unique: false,
        name: 'Inputs_TransactionId_index',
      }),
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
      queryInterface.removeIndex('Blocks', 'Blocks_blockNumber_index'),
      queryInterface.removeIndex('Blocks', 'Blocks_hash_index'),
      queryInterface.removeIndex('Transactions', 'Transactions_hash_index'),
      queryInterface.removeIndex('Transactions', 'Transactions_BlockId_index'),
      queryInterface.removeIndex('Outputs', 'Outputs_address_index'),
      queryInterface.removeIndex('Outputs', 'Outputs_asset_index'),
      queryInterface.removeIndex('Outputs', 'Outputs_lockType_index'),
      queryInterface.removeIndex('Outputs', 'Outputs_TransactionId_index'),
      queryInterface.removeIndex('Inputs', 'Inputs_OutputId_index'),
      queryInterface.removeIndex('Inputs', 'Inputs_TransactionId_index'),
      queryInterface.removeConstraint(
        'Commands',
        'Commands_TransactionId_indexInTransaction_unique_constraint'
      ),
      queryInterface.removeIndex('Commands', 'Commands_TransactionId_index'),
      queryInterface.removeIndex('Commands', 'Commands_ContractId_index'),
    ]);
  },
};
