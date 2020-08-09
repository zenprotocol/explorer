'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    const voteIntervalsPromise = queryInterface
      .createTable('VoteIntervals', {
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
        beginHeight: {
          allowNull: false,
          type: Sequelize.INTEGER,
        },
        endHeight: {
          type: Sequelize.INTEGER,
        },
        hasSnapshot: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      })
      .then(() =>
        queryInterface.addConstraint('VoteIntervals', {
          fields: ['interval'],
          type: 'UNIQUE',
          name: 'VoteIntervals_interval_unique_constraint',
        })
      );
    const snapshotsPromise = queryInterface.createTable('Snapshots', {
      height: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      address: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      amount: {
        allowNull: false,
        type: Sequelize.BIGINT,
      },
    });
    const repoVotesPromise = queryInterface
      .createTable('RepoVotes', {
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
        interval: {
          type: Sequelize.INTEGER,
        },
        commitId: {
          type: Sequelize.STRING,
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
        queryInterface.addConstraint('RepoVotes', {
          fields: ['CommandId'],
          type: 'foreign key',
          name: 'RepoVotes_CommandId_fkey',
          references: {
            table: 'Commands',
            field: 'id',
          },
          onDelete: 'cascade',
          onUpdate: 'cascade',
        })
      );

    return Promise.all([voteIntervalsPromise, snapshotsPromise, repoVotesPromise]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.dropTable('VoteIntervals'),
      queryInterface.dropTable('Snapshots'),
      queryInterface.dropTable('RepoVotes'),
    ]);
  },
};
