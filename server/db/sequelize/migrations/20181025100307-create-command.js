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
      command: {
        type: Sequelize.STRING,
      },
      messageBody: {
        type: Sequelize.STRING,
      },
      TransactionId: {
        type: Sequelize.BIGINT,
      },
      indexInTransaction: {
        type: Sequelize.INTEGER,
      },
      ContractId: {
        type: Sequelize.STRING,
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
