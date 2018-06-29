'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Inputs', 'OutputId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'Outputs',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Inputs', 'OutputId');
  },
};
