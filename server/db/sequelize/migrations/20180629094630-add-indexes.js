'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addIndex('Blocks', {
        fields: ['blockNumber'],
        unique: true,
        name: 'Blocks_blockNumber_index',
      }),
      queryInterface.addIndex('Transactions', {
        fields: ['hash'],
        unique: true,
        name: 'Transactions_hash_index',
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeIndex('Blocks', 'Blocks_parent_index'),
      queryInterface.removeIndex('Blocks', 'Blocks_blockNumber_index'),
      queryInterface.removeIndex('Transactions', 'Transactions_hash_index'),
    ]);
  },
};
