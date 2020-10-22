'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('AssetTxs', {
        blockNumber: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        txId: {
          allowNull: false,
          type: Sequelize.BIGINT,
        },
        asset: {
          allowNull: false,
          type: Sequelize.STRING,
        },
      })
      .then(() =>
        Promise.all([
          queryInterface.addIndex('AssetTxs', {
            fields: ['asset'],
            unique: false,
            name: 'AssetTxs_asset_index',
          }),
          queryInterface.addIndex('AssetTxs', {
            fields: ['txId'],
            unique: false,
            name: 'AssetTxs_txId_index',
          }),
        ])
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('AssetTxs');
  },
};
