'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('ZpSupplyPerDay', {
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
        type: Sequelize.DOUBLE, // after 2nd halving 12.5
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('ZpSupplyPerDay');
  },
};
