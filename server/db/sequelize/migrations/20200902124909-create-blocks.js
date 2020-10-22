'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Blocks', {
        blockNumber: {
          primaryKey: true,
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        version: {
          type: Sequelize.INTEGER,
        },
        hash: {
          type: Sequelize.STRING,
        },
        parent: {
          type: Sequelize.STRING,
        },
        commitments: {
          type: Sequelize.STRING,
        },
        timestamp: {
          type: Sequelize.BIGINT,
        },
        difficulty: {
          type: Sequelize.BIGINT,
        },
        nonce1: {
          type: Sequelize.BIGINT,
        },
        nonce2: {
          type: Sequelize.BIGINT,
        },
        txsCount: {
          type: Sequelize.BIGINT,
        },
        reward: {
          type: Sequelize.BIGINT,
        },
        coinbaseAmount: {
          type: Sequelize.BIGINT,
        },
        allocationAmount: {
          type: Sequelize.BIGINT,
        },
      })
      .then(() =>
        queryInterface.addIndex('Blocks', {
          fields: ['hash'],
          unique: true,
          name: 'Blocks_hash_index',
        })
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Blocks');
  },
};
