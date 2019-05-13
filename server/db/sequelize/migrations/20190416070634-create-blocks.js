'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Blocks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      version: {
        type: Sequelize.INTEGER,
      },
      hash: {
        type: Sequelize.STRING,
      },
      parent: {
        type: Sequelize.STRING,
      },
      blockNumber: {
        type: Sequelize.INTEGER,
      },
      commitments: {
        type: Sequelize.STRING,
      },
      timestamp: {
        type: Sequelize.BIGINT,
      },
      difficulty: {
        type: Sequelize.BIGINT,
      },
      nonce1: {
        type: Sequelize.BIGINT,
      },
      nonce2: {
        type: Sequelize.BIGINT,
      },
      transactionCount: {
        type: Sequelize.BIGINT,
      },
      reward: {
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
    return queryInterface.dropTable('Blocks');
  },
};
