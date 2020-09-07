'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Snapshots', {
        blockNumber: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        address: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        amount: {
          allowNull: false,
          type: Sequelize.BIGINT,
        },
      })
      .then(() =>
        queryInterface.addIndex('Snapshots', {
          fields: ['blockNumber'],
          unique: false,
          name: 'Snapshots_blockNumber_index',
        })
      );
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('Snapshots');
  },
};
