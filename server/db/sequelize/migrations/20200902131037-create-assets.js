'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Assets', {
      asset: {
        primaryKey: true,
        allowNull: false,
        type: Sequelize.STRING,
      },
      issued: {
        type: Sequelize.BIGINT,
      },
      destroyed: {
        type: Sequelize.BIGINT,
      },
      outstanding: {
        type: Sequelize.BIGINT,
      },
      keyholders: {
        type: Sequelize.BIGINT,
      },
      txsCount: {
        type: Sequelize.BIGINT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Assets');
  },
};
