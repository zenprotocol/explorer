'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      BlockId: {
        type: Sequelize.INTEGER,
      },
      index: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      version: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      hash: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      inputCount: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      outputCount: {
        allowNull: false,
        type: Sequelize.INTEGER,
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
    return queryInterface.dropTable('Transactions');
  },
};
