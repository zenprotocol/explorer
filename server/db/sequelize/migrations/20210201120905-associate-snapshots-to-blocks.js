'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.addConstraint('Snapshots', {
      fields: ['blockNumber'],
      type: 'foreign key',
      name: 'Snapshots_blockNumber_fkey',
      references: {
        table: 'Blocks',
        field: 'blockNumber',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeConstraint('Snapshots', 'Snapshots_blockNumber_fkey');
  },
};
