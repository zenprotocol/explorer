'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('Outputs', {
      fields: [Sequelize.literal('"asset" varchar_pattern_ops')], // varchar_pattern_ops = POSTGRES OPTIMIZATION!
      unique: false,
      name: 'Outputs_asset_index',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Outputs', 'Outputs_asset_index');
  },
};
