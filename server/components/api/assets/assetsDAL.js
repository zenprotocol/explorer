'use strict';

const tags = require('common-tags');
const sequelize = require('../../../db/sequelize/models').sequelize;
const dal = require('../../../lib/dal');
const statsDAL = require('../stats/statsDAL');

const assetsDAL = dal.createDAL('');

assetsDAL.findOutstanding = function(asset) {
  const sql = tags.oneLine`
  SELECT
    COALESCE("Issued"."asset", "Destroyed"."asset") AS "asset",
    COALESCE("Issued"."sum", 0) AS "issued",
    COALESCE("Destroyed"."sum", 0) AS "destroyed",
    COALESCE("Issued"."sum", 0) -  COALESCE("Destroyed"."sum", 0) AS "outstanding",
    "Keyholders"."total" AS "keyholders"
  FROM
    (SELECT asset, SUM("amount") AS sum
    FROM "Inputs"
    WHERE "Inputs"."asset" = :asset
      AND "Inputs"."isMint" = 'true'
    GROUP BY "Inputs"."asset") AS "Issued"
    LEFT JOIN
    (SELECT asset, SUM("amount") AS sum
    FROM "Outputs"
    WHERE "Outputs"."asset" = :asset
      AND "Outputs"."lockType" = 'Destroy'
    GROUP BY "Outputs"."asset") AS "Destroyed"
    ON "Issued"."asset" = "Destroyed"."asset" 
    LEFT JOIN
    (SELECT COUNT("UniqueAddresses"."address") AS "total", "UniqueAddresses"."asset"
    FROM
      (SELECT "address", "asset"
      FROM "Outputs"
      WHERE "Outputs"."asset" = :asset
      GROUP BY "Outputs"."asset", "Outputs"."address") AS "UniqueAddresses"
    GROUP BY "UniqueAddresses"."asset") AS "Keyholders"
    ON "Issued"."asset" = "Keyholders"."asset"
  `;

  return sequelize.query(sql, {
    replacements: {
      asset,
    },
    type: sequelize.QueryTypes.SELECT,
  }).then(results => results.length ? results[0] : null);
};

assetsDAL.keyholders = async function({ asset, limit, offset } = {}) {
  if (!asset) {
    return this.getItemsAndCountResult([0, []]);
  }

  return Promise.all([
    statsDAL.distributionMapCount(asset),
    statsDAL.distributionMap(asset, 1, limit, offset),
  ]).then(result => {
    return this.getItemsAndCountResult(result);
  });
};

module.exports = assetsDAL;
