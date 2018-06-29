'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Inputs', 'TransactionId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'Transactions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Inputs', 'TransactionId');
  },
};
