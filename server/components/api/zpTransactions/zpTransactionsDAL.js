'use strict';

const dal = require('../../../lib/dal');
const sequelize = require('../../../db/sequelize/models').sequelize;

const zpTransactionsDAL = dal.createDAL('ZpTransaction');

zpTransactionsDAL.refreshView = function() {
  return sequelize.query('REFRESH MATERIALIZED VIEW CONCURRENTLY "ZpTransactions";');
};

module.exports = zpTransactionsDAL;
