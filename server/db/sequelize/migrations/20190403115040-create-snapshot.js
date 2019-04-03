'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Snapshots', {
      height: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      address: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      amount: {
        allowNull: false,
        type: Sequelize.BIGINT,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Snapshots');
  },
};
