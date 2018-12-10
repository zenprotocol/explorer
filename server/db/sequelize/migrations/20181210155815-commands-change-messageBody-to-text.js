'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Commands', 'messageBody', {
      type: Sequelize.TEXT,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('Commands', 'messageBody', {
      type: Sequelize.STRING,
    });
  },
};
