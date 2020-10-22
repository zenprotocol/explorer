'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('TxsPerDay', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      value: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('TxsPerDay');
  },
};
