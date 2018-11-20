'use strict';

const dal = require('../../../lib/dal');
const statsDAL = require('../stats/statsDAL');
const zpAddressAmountsDAL = require('../zpAddressAmounts/zpAddressAmountsDAL');
const assetOutstandingsDAL = require('../assetOutstandings/assetOutstandingsDAL');

const assetsDAL = dal.createDAL('');
const Op = assetsDAL.db.sequelize.Op;

assetsDAL.findOutstanding = function(asset) {
  return assetOutstandingsDAL.findOne({
    where: {
      asset,
    },
  }).then(assetOutstanding => assetOutstanding ? assetOutstandingsDAL.toJSON(assetOutstanding) : null);
};

assetsDAL.keyholders = function({ asset, limit, offset } = {}) {
  if (!asset) {
    return this.getItemsAndCountResult([0, []]);
  }

  const promises =
    asset === '00'
      ? [zpAddressAmountsDAL.count(), zpAddressAmountsDAL.findAll({ limit, offset })]
      : [statsDAL.distributionMapCount(asset), statsDAL.distributionMap(asset, 1, limit, offset)];
  return Promise.all(promises).then(result => {
    return this.getItemsAndCountResult(result);
  });
};

assetsDAL.search = async function(search, limit = 10) {
  const like = `%${search}%`;
  const where = {
    asset: {
      [Op.like]: like,
    },
  };
  return Promise.all([
    assetOutstandingsDAL.count({
      where,
    }),
    assetOutstandingsDAL.findAll({
      where,
      attributes: ['asset'],
      limit,
    }),
  ]);
};

module.exports = assetsDAL;
