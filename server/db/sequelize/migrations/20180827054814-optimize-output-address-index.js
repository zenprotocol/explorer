'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Outputs', 'Outputs_address_index').then(() => {
      return queryInterface.addIndex('Outputs', {
        fields: [Sequelize.literal('"address" varchar_pattern_ops')], // varchar_pattern_ops = POSTGRES OPTIMIZATION!
        unique: false,
        name: 'Outputs_address_index',
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Outputs', 'Outputs_address_index').then(() => {
      queryInterface.addIndex('Outputs', {
        fields: ['address'],
        unique: false,
        name: 'Outputs_address_index',
      });
    });
  },
};
