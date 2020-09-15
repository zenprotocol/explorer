'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');

const assetTxsDAL = dal.createDAL('AssetTx');
const sequelize = assetTxsDAL.db.sequelize;

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

assetTxsDAL.findAllByAssetWithRelations = function ({ asset, limit, offset } = {}) {
  const sql = tags.oneLine`
  SELECT "AssetTxs"."blockNumber", 
    "Blocks"."timestamp", 
    "Txs"."hash" AS "txHash", 
    CASE WHEN "Txs"."index" = 0 THEN true
      ELSE false
      END AS "isCoinbaseTx"
  FROM "AssetTxs"
  JOIN "Txs" ON "AssetTxs"."txId" = "Txs".id
  JOIN "Blocks" ON "AssetTxs"."blockNumber" = "Blocks"."blockNumber"
  WHERE "AssetTxs"."asset" = :asset
  ORDER BY "AssetTxs"."blockNumber" DESC, "Txs"."index" DESC
  LIMIT :limit OFFSET :offset
`;

  return sequelize.query(sql, {
    replacements: {
      asset,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

module.exports = assetTxsDAL;
