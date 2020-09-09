'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Addresses', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT,
        },
        address: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        asset: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        inputSum: {
          type: Sequelize.BIGINT,
        },
        outputSum: {
          type: Sequelize.BIGINT,
        },
        balance: {
          type: Sequelize.BIGINT,
        },
        txsCount: {
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
      })
      .then(() =>
        queryInterface.addIndex('Addresses', {
          fields: ['address', 'asset'],
          unique: true,
          name: 'Addresses_address_asset_index',
        })
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Addresses');
  },
};
