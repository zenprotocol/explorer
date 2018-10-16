'use strict';
const seeds = require('../seeds/contract-templates');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('ContractTemplates', seeds, {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('ContractTemplates', null, {});
  },
};
