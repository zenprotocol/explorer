'use strict';

const dal = require('../../../lib/dal');
const sequelize = require('../../../db/sequelize/models').sequelize;

const addressAmountsDAL = dal.createDAL('AddressAmount');
const Op = addressAmountsDAL.db.sequelize.Op;

addressAmountsDAL.refreshView = function() {
  return sequelize.query('REFRESH MATERIALIZED VIEW CONCURRENTLY "AddressAmounts";');
};

addressAmountsDAL.keyholders = function({ asset, limit, offset = 0 } = {}) {
  const where = {
    [Op.and]: {
      asset,
      balance: {
        [Op.gt]: 0,
      },
    },
  };
  return Promise.all([this.count({ where }), this.findAll({ where, limit, offset })]).then(
    this.getItemsAndCountResult
  );
};

module.exports = addressAmountsDAL;
