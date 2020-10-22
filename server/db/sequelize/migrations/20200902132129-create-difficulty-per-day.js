'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('DifficultyPerDay', {
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
        type: Sequelize.DOUBLE,
      },
    });
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('DifficultyPerDay');
  },
};
