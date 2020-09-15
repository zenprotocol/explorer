'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface
      .createTable('RepoVoteIntervals', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        interval: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        phase: {
          type: Sequelize.STRING,
        },
        beginBlock: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        endBlock: {
          type: Sequelize.INTEGER,
        },
        threshold: {
          type: Sequelize.BIGINT,
        },
        prevPhaseId: {
          type: Sequelize.INTEGER,
        },
        hasSnapshot: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      })
      .then(() =>
        Promise.all([
          queryInterface.addConstraint('RepoVoteIntervals', {
            fields: ['interval', 'phase'],
            type: 'unique',
            name: 'RepoVoteIntervals_interval_phase_unique_constraint',
          }),
          queryInterface.addConstraint('RepoVoteIntervals', {
            fields: ['prevPhaseId'],
            type: 'foreign key',
            name: 'VoteIntervals_prevPhaseId_fkey',
            references: {
              table: 'RepoVoteIntervals',
              field: 'id',
            },
            onDelete: 'set null',
            onUpdate: 'cascade',
          }),
        ])
      );
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('RepoVoteIntervals');
  },
};
