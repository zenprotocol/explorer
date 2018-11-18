'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('Outputs', {
      fields: ['lockType'],
      unique: false,
      name: 'Outputs_lockType_index',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Outputs', 'Outputs_lockType_index');
  },
};
