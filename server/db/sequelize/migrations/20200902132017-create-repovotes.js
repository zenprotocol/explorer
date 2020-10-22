'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('RepoVotes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      executionId: {
        allowNull: false,
        type: Sequelize.BIGINT,
      },
      blockNumber: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      txHash: {
        type: Sequelize.STRING,
      },
      commitId: {
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.STRING,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('RepoVotes');
  },
};
