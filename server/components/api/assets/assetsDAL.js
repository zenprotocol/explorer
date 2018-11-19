'use strict';

const dal = require('../../../lib/dal');
const statsDAL = require('../stats/statsDAL');
const outputsDAL = require('../outputs/outputsDAL');
const zpAddressAmountsDAL = require('../zpAddressAmounts/zpAddressAmountsDAL');
const assetOutstandingsDAL = require('../assetOutstandings/assetOutstandingsDAL');

const assetsDAL = dal.createDAL('');
const Op = assetsDAL.db.sequelize.Op;

assetsDAL.findOutstanding = function(asset) {
  return assetOutstandingsDAL.findOne({
    where: {
      asset,
    },
  });
};

assetsDAL.findZP = function() {
  return Promise.all([
    statsDAL.totalZp(),
    outputsDAL.sum('amount', {
      where: {
        [Op.and]: {
          asset: '00',
          lockType: 'Destroy',
        },
      },
    }),
    zpAddressAmountsDAL.count(),
  ]).then(([issued, destroyed, keyholders]) => {
    return {
      asset: '00',
      issued: Math.floor(issued * 100000000),
      destroyed: destroyed || 0,
      outstanding: Math.floor(issued * 100000000) - (destroyed || 0),
      keyholders,
    };
  });
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

module.exports = assetsDAL;
