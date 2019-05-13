'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ContractActivations', {
      ContractId: {
        type: Sequelize.STRING,
      },
      TransactionId: {
        type: Sequelize.BIGINT,
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('ContractActivations');
  },
};
