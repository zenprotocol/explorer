'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addConstraint('RepoVotes', ['TransactionId'], {
      type: 'foreign key',
      name: 'RepoVotes_TransactionId_fkey',
      references: {
        table: 'Transactions',
        field: 'id',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeConstraint('RepoVotes', 'RepoVotes_TransactionId_fkey');
  },
};
