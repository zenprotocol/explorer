'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('AddressTransactions', {
      AddressId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'Addresses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      TransactionId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'Transactions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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
