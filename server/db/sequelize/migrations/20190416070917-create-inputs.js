'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Inputs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      TransactionId: {
        type: Sequelize.BIGINT,
      },
      OutputId: {
        type: Sequelize.BIGINT,
      },
      index: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      outpointTXHash: {
        type: Sequelize.STRING,
      },
      outpointIndex: {
        type: Sequelize.INTEGER,
      },
      isMint: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      asset: {
        type: Sequelize.STRING,
      },
      amount: {
        type: Sequelize.BIGINT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Inputs');
  },
};
