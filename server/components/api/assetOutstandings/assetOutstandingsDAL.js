'use strict';

const dal = require('../../../lib/dal');
const sequelize = require('../../../db/sequelize/models').sequelize;

const assetOutstandingsDAL = dal.createDAL('AssetOutstanding');

assetOutstandingsDAL.refreshView = function() {
  return sequelize.query('REFRESH MATERIALIZED VIEW CONCURRENTLY "AssetOutstandings";');
};

module.exports = assetOutstandingsDAL;
