'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('Activations', {
        contractId: {
          type: Sequelize.STRING,
        },
        txId: {
          type: Sequelize.BIGINT,
        },
      })
      .then(() =>
        queryInterface.addConstraint('Activations', {
          fields: ['contractId', 'txId'],
          type: 'primary key',
          name: 'Activations_pkey',
        })
      );
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Activations');
  },
};
