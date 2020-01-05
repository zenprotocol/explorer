'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('CGPIntervals', {
        interval: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        calculatedAtBlockId: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        winnerPayout: {
          type: Sequelize.TEXT,
        },
        winnerAllocation: {
          type: Sequelize.TEXT,
        },
      })
      .then(() => {
        queryInterface.addConstraint('CGPIntervals', ['calculatedAtBlockId'], {
          type: 'foreign key',
          name: 'CGPIntervals_calculatedAtBlockId_fkey',
          references: {
            table: 'Blocks',
            field: 'id',
          },
          onUpdate: 'cascade',
          onDelete: 'cascade',
        });
      });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CGPIntervals');
  },
};
