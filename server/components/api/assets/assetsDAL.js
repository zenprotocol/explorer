'use strict';

const dal = require('../../../lib/dal');
const addressAmountsDAL = require('../addressAmounts/addressAmountsDAL');
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

  return addressAmountsDAL.keyholders({ asset, limit, offset });
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
