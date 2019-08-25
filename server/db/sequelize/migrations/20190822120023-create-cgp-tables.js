'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('CGPVotes', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        CommandId: {
          allowNull: false,
          type: Sequelize.BIGINT,
        },
        type: {
          type: Sequelize.ENUM('allocation', 'payout'),
        },
        ballot: {
          type: Sequelize.TEXT,
        },
        address: {
          type: Sequelize.STRING,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      })
      .then(() =>
        queryInterface.addConstraint('CGPVotes', ['CommandId'], {
          type: 'foreign key',
          name: 'CGPVotes_CommandId_fkey',
          references: {
            table: 'Commands',
            field: 'id',
          },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        })
      );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('CGPVotes');
  },
};
