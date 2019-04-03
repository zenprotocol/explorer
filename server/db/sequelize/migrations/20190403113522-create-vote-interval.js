'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('VoteIntervals', {
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
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('VoteIntervals');
  },
};
