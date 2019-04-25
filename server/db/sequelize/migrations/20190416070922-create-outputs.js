'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Outputs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      TransactionId: {
        type: Sequelize.BIGINT,
      },
      lockType: {
        type: Sequelize.STRING,
      },
      contractLockVersion: {
        type: Sequelize.INTEGER,
      },
      address: {
        type: Sequelize.STRING,
      },
      lockValue: {
        type: Sequelize.STRING,
      },
      asset: {
        type: Sequelize.STRING,
      },
      amount: {
        allowNull: false,
        type: Sequelize.BIGINT,
      },
      index: {
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
    return queryInterface.dropTable('Outputs');
  },
};
