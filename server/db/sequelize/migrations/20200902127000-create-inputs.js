'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Inputs', {
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
        outputId: {
          type: Sequelize.BIGINT,
        },
        index: {
          type: Sequelize.INTEGER,
        },
        outpointTxHash: {
          type: Sequelize.STRING,
        },
        outpointIndex: {
          type: Sequelize.INTEGER,
        },
        isMint: {
          type: Sequelize.BOOLEAN,
        },
        lockType: {
          type: Sequelize.STRING,
        },
        address: {
          type: Sequelize.STRING,
        },
        asset: {
          type: Sequelize.STRING,
        },
        amount: {
          type: Sequelize.BIGINT,
        },
      })
      .then(() =>
        Promise.all([
          queryInterface.addIndex('Inputs', {
            fields: [Sequelize.literal('"address" varchar_pattern_ops')], // POSTGRES OPTIMIZATION
            unique: false,
            name: 'Inputs_address_index',
          }),
          queryInterface.addIndex('Inputs', {
            fields: ['outputId'],
            unique: true,
            name: 'Inputs_outputId_index',
          }),
          queryInterface.addIndex('Inputs', {
            fields: ['txId'],
            unique: false,
            name: 'Inputs_txId_index',
          }),
        ])
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Inputs');
  },
};
