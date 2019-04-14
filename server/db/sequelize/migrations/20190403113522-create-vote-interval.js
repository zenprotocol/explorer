'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('VoteIntervals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      interval: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      beginHeight: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      endHeight: {
        type: Sequelize.INTEGER,
      },
      hasSnapshot: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('VoteIntervals');
  },
};
