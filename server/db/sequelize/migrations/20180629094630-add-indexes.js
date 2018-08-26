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
      queryInterface.addIndex('Outputs', {
        fields: ['address'],
        unique: false,
        name: 'Outputs_address_index',
      }),
      queryInterface.addIndex('Inputs', {
        fields: ['OutputId'],
        unique: false,
        name: 'Inputs_OutputId_index',
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeIndex('Blocks', 'Blocks_blockNumber_index'),
      queryInterface.removeIndex('Blocks', 'Blocks_hash_index'),
      queryInterface.removeIndex('Transactions', 'Transactions_hash_index'),
      queryInterface.removeIndex('Outputs', 'Outputs_address_index'),
      queryInterface.removeIndex('Inputs', 'Inputs_OutputId_index'),
    ]);
  },
};
