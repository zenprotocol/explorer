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
        ])
      );
  },

  down: async (queryInterface) => {
    return queryInterface.dropTable('RepoVoteIntervals');
  },
};
