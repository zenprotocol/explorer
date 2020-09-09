'use strict';

const dal = require('../../../lib/dal');

const assetTxsDAL = dal.createDAL('AssetTx');

assetTxsDAL.findAllByAsset = function (asset, options) {
  return this.findAll(
    Object.assign(
      {},
      {
        where: {
          asset,
        },
      },
      options
    )
  );
};

module.exports = assetTxsDAL;
