'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Outputs', 'TransactionId', {
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
    return queryInterface.removeColumn('Outputs', 'TransactionId');
  },
};
