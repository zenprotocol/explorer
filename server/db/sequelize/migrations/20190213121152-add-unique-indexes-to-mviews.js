'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addIndex('AddressAmounts', {
        fields: ['address', 'asset'],
        unique: true,
        name: 'AddressAmounts_address_asset_index',
      }),
      queryInterface.addIndex('AssetOutstandings', {
        fields: ['asset'],
        unique: true,
        name: 'AssetOutstandings_asset_index',
      }),
      queryInterface.addIndex('ZpTransactions', {
        fields: ['transactionId'],
        unique: true,
        name: 'ZpTransactions_transactionId_index',
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeIndex('AddressAmounts', 'AddressAmounts_address_asset_index'),
      queryInterface.removeIndex('AssetOutstandings', 'AssetOutstandings_asset_index'),
      queryInterface.removeIndex('ZpTransactions', 'ZpTransactions_transactionId_index'),
    ]);
  },
};
