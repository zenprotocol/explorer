'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface
      .bulkDelete('CGPVotes', {
        id: { [Sequelize.Op.gt]: 0 },
      })
      .then(() => queryInterface.removeColumn('CGPVotes', 'type'))
      .then(() =>
        queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CGPVotes_type"', {
          type: queryInterface.sequelize.QueryTypes.DELETE,
        })
      )
      .then(() =>
        queryInterface.addColumn(
          'CGPVotes',
          'type',
          Sequelize.ENUM('allocation', 'payout', 'nomination')
        )
      );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface
      .bulkDelete('CGPVotes', {
        id: { [Sequelize.Op.gt]: 0 },
      })
      .then(() => queryInterface.removeColumn('CGPVotes', 'type'))
      .then(() =>
        queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_CGPVotes_type"', {
          type: queryInterface.sequelize.QueryTypes.DELETE,
        })
      )
      .then(() =>
        queryInterface.addColumn('CGPVotes', 'type', Sequelize.ENUM('allocation', 'payout'))
      );
  },
};
