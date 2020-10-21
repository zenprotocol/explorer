'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Outputs', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT,
        },
        blockNumber: {
          type: Sequelize.INTEGER,
        },
        txId: {
          type: Sequelize.BIGINT,
        },
        index: {
          type: Sequelize.INTEGER,
        },
        lockType: {
          type: Sequelize.STRING,
        },
        lockValue: {
          type: Sequelize.STRING,
        },
        address: {
          type: Sequelize.STRING,
        },
        asset: {
          type: Sequelize.STRING,
        },
        amount: {
          allowNull: false,
          type: Sequelize.BIGINT,
        }
      })
      .then(() =>
        Promise.all([
          queryInterface.addIndex('Outputs', {
            fields: [Sequelize.literal('"address" varchar_pattern_ops')], // POSTGRES OPTIMIZATION
            unique: false,
            name: 'Outputs_address_index',
          }),
          queryInterface.addIndex('Outputs', {
            fields: [Sequelize.literal('"asset" varchar_pattern_ops')], // POSTGRES OPTIMIZATION
            unique: false,
            name: 'Outputs_asset_index',
          }),
          queryInterface.addIndex('Outputs', {
            fields: ['txId'],
            unique: false,
            name: 'Outputs_txId_index',
          }),
        ])
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Outputs');
  },
};
