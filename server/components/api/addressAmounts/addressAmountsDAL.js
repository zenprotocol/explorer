'use strict';

const dal = require('../../../lib/dal');
const sequelize = require('../../../db/sequelize/models').sequelize;

const addressAmountsDAL = dal.createDAL('AddressAmount');

addressAmountsDAL.refreshView = function() {
  return sequelize.query('REFRESH MATERIALIZED VIEW "AddressAmounts";');
};

module.exports = addressAmountsDAL;
