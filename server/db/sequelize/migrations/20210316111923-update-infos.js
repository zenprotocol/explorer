'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Infos', 'value', {
        type: Sequelize.TEXT,
        allowNull: true,
      })
    ]);
  },
  
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('Infos', 'value', {
        type: Sequelize.STRING,
        allowNull: true,
      })
    ]);
  }
};
