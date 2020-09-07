'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Executions', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT,
        },
        contractId: {
          type: Sequelize.STRING,
        },
        blockNumber: {
          type: Sequelize.INTEGER,
        },
        txId: {
          type: Sequelize.BIGINT,
        },
        command: {
          type: Sequelize.TEXT,
        },
        messageBody: {
          type: Sequelize.JSON,
        },
        indexInTx: {
          type: Sequelize.INTEGER,
        },
      })
      .then(() =>
        Promise.all([
          queryInterface.addConstraint('Executions', {
            fields: ['txId', 'indexInTx'],
            type: 'unique',
            name: 'Executions_txId_indexInTx_unique_constraint',
          }),
          queryInterface.addIndex('Executions', {
            fields: ['txId'],
            unique: false,
            name: 'Executions_txId_index',
          }),
          queryInterface.addIndex('Executions', {
            fields: ['contractId'],
            unique: false,
            name: 'Executions_contractId_index',
          }),
        ])
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Executions');
  },
};
