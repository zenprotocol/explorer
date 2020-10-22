'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Contracts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      version: {
        type: Sequelize.INTEGER,
      },
      code: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      expiryBlock: {
        type: Sequelize.INTEGER,
      },
      txsCount: {
        type: Sequelize.BIGINT,
      },
      assetsIssued: {
        type: Sequelize.BIGINT,
      },
      lastActivationBlock: {
        type: Sequelize.INTEGER,
      },
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Contracts');
  },
};
