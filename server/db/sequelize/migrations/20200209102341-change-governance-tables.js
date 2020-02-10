'use strict';

/**
 * Adds support for 2 phase votes (nominees and voting)
 */

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.bulkDelete('VoteIntervals', {
        id: { [Sequelize.Op.gt]: 0 }
      }),
      queryInterface.bulkDelete('RepoVotes', {
        id: { [Sequelize.Op.gt]: 0 }
      })
    ]).then(() =>
      queryInterface
        .removeConstraint(
          'VoteIntervals',
          'VoteIntervals_interval_unique_constraint'
        )
        .then(() =>
          Promise.all([
            queryInterface.addColumn('VoteIntervals', 'phase', {
              type: Sequelize.STRING
            }),
            queryInterface.addColumn('VoteIntervals', 'thresholdZp', {
              type: Sequelize.BIGINT
            }),
            queryInterface.addColumn('VoteIntervals', 'prevPhaseId', {
              type: Sequelize.INTEGER
            })
          ])
        )
        .then(() =>
          queryInterface.removeColumn('RepoVotes', 'interval')
        )
        .then(() =>
          Promise.all([
            queryInterface.addConstraint(
              'VoteIntervals',
              ['interval', 'phase'],
              {
                type: 'unique',
                name: 'VoteIntervals_interval_phase_unique_constraint'
              }
            ),
            queryInterface.addConstraint('VoteIntervals', ['prevPhaseId'], {
              type: 'foreign key',
              name: 'VoteIntervals_prevPhaseId_fkey',
              references: {
                table: 'VoteIntervals',
                field: 'id'
              },
              onDelete: 'set null',
              onUpdate: 'cascade'
            })
          ])
        )
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeConstraint(
        'VoteIntervals',
        'VoteIntervals_interval_phase_unique_constraint'
      ),
      queryInterface.removeConstraint(
        'VoteIntervals',
        'VoteIntervals_prevPhaseId_fkey'
      )
    ])
      .then(() =>
        Promise.all([
          queryInterface.bulkDelete('VoteIntervals', {
            id: { [Sequelize.Op.gt]: 0 }
          }),
          queryInterface.bulkDelete('RepoVotes', {
            id: { [Sequelize.Op.gt]: 0 }
          })
        ])
      )
      .then(() =>
        Promise.all([
          queryInterface.removeColumn('VoteIntervals', 'phase'),
          queryInterface.removeColumn('VoteIntervals', 'thresholdZp'),
          queryInterface.removeColumn('VoteIntervals', 'prevPhaseId')
        ])
      )
      .then(() => queryInterface.addColumn('RepoVotes', 'interval', {
        type: Sequelize.INTEGER,
      }))
      .then(() =>
        queryInterface.addConstraint('VoteIntervals', ['interval'], {
          type: 'unique',
          name: 'VoteIntervals_interval_unique_constraint'
        })
      );
  }
};
