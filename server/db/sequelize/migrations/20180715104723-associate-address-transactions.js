'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('AddressTransactions', {
      AddressId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      TransactionId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM('input', 'output'),
      },
      asset: {
        allowNull: false,
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
    return queryInterface.dropTable('AddressTransactions');
  },
};
