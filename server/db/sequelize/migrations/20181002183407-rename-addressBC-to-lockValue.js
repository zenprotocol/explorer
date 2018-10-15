'use strict';
module.exports = {
  up: queryInterface => {
    return queryInterface.renameColumn('Outputs', 'addressBC', 'lockValue');
  },
  down: queryInterface => {
    return queryInterface.renameColumn('Outputs', 'lockValue', 'addressBC');
  },
};
