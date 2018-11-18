'use strict';

const dal = require('../../../lib/dal');
const sequelize = require('../../../db/sequelize/models').sequelize;

const zpAddressAmountsDAL = dal.createDAL('ZpAddressAmount');

zpAddressAmountsDAL.refreshView = function() {
  return sequelize.query('REFRESH MATERIALIZED VIEW "ZpAddressAmounts";');
};

module.exports = zpAddressAmountsDAL;
