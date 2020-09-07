'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('AddressTxs', {
        blockNumber: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        txId: {
          allowNull: false,
          type: Sequelize.BIGINT,
        },
        address: {
          allowNull: false,
          type: Sequelize.STRING,
        },
      })
      .then(() =>
        Promise.all([
          queryInterface.addIndex('AddressTxs', {
            fields: ['address'],
            unique: false,
            name: 'AddressTxs_address_index',
          }),
          queryInterface.addIndex('AddressTxs', {
            fields: ['txId'],
            unique: false,
            name: 'AddressTxs_txId_index',
          }),
        ])
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('AddressTxs');
  },
};
