'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Txs', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT,
        },
        blockNumber: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        index: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        version: {
          type: Sequelize.INTEGER,
        },
        hash: {
          allowNull: false,
          type: Sequelize.STRING,
        },
        inputCount: {
          type: Sequelize.INTEGER,
        },
        outputCount: {
          type: Sequelize.INTEGER,
        },
      })
      .then(() =>
        Promise.all([
          queryInterface.addIndex('Txs', {
            fields: ['hash'],
            unique: true,
            name: 'Txs_hash_index',
          }),
          queryInterface.addIndex('Txs', {
            fields: ['blockNumber'],
            unique: false,
            name: 'Txs_blockNumber_index',
          }),
        ])
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Txs');
  },
};
