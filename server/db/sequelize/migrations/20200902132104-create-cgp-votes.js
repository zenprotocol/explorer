'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('CgpVotes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      type: {
        type: Sequelize.ENUM('nomination', 'allocation', 'payout'),
      },
      ballot: {
        type: Sequelize.TEXT,
      },
      address: {
        type: Sequelize.STRING,
      },
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('CgpVotes');
  },
};
