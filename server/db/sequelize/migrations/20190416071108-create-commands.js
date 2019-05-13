'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Commands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      TransactionId: {
        type: Sequelize.BIGINT,
      },
      ContractId: {
        type: Sequelize.STRING,
      },
      command: {
        type: Sequelize.STRING,
      },
      messageBody: {
        type: Sequelize.JSON,
      },
      indexInTransaction: {
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
    return queryInterface.dropTable('Commands');
  },
};
