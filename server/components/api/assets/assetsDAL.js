'use strict';

const dal = require('../../../lib/dal');
const addressesDAL = require('../addresses/addressesDAL');

const assetsDAL = dal.createDAL('Asset');
const Op = assetsDAL.db.Sequelize.Op;

assetsDAL.keyholders = function({ asset, limit, offset } = {}) {
  if (!asset) {
    return this.getItemsAndCountResult([0, []]);
  }

  return addressesDAL.keyholders({ asset, limit, offset });
};

assetsDAL.search = async function(search, limit = 10) {
  const like = `%${search}%`;
  const where = {
    asset: {
      [Op.like]: like,
    },
  };
  return Promise.all([
    this.count({
      where,
    }),
    this.findAll({
      where,
      attributes: ['asset'],
      limit,
    }),
  ]);
};

module.exports = assetsDAL;
