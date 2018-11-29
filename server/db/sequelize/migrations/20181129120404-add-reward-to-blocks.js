'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Blocks', 'reward', {
      type: Sequelize.BIGINT,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Blocks', 'reward');
  },
};
