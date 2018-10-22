'use strict';

const dal = require('../../../lib/dal');
const Op = require('sequelize').Op;

const contractsDAL = dal.createDAL('Contract');

contractsDAL.findByAddress = function(address) {
  return this.findOne({
    where: {
      address,
    },
  });
};

contractsDAL.findAllActive = function() {
  return this.findAll({
    where: {
      expiryBlock: {
        [Op.ne]: null,
      },
    },
  });
};

contractsDAL.findAllExpired = function() {
  return this.findAll({
    where: {
      expiryBlock: null,
    },
  });
};

contractsDAL.findAllOutstandingAssets = function(id, { limit = 10, offset = 0 } = {}) {
  const sequelize = contractsDAL.db.sequelize;
  const sql = `
  SELECT
    COALESCE("Issued"."asset", "Destroyed"."asset") AS "asset",
    "Issued"."sum" AS "issued",
    "Destroyed"."sum" AS "destroyed",
    COALESCE("Issued"."sum", 0) -  COALESCE("Destroyed"."sum", 0) AS "outstanding",
    "Keyholders"."total" AS "keyholders"
  FROM
    (SELECT asset, SUM("amount") AS sum
    FROM "Inputs"
    WHERE "Inputs"."asset" LIKE :assetSearch
      AND "Inputs"."isMint" = 'true'
    GROUP BY "Inputs"."asset") AS "Issued"
    LEFT JOIN
    (SELECT asset, SUM("amount") AS sum
    FROM "Outputs"
    WHERE "Outputs"."asset" LIKE :assetSearch
      AND "Outputs"."lockType" = 'Destroy'
    GROUP BY "Outputs"."asset") AS "Destroyed"
    ON "Issued"."asset" = "Destroyed"."asset" 
    LEFT JOIN
    (SELECT COUNT("UniqueAddresses"."address") AS "total", "UniqueAddresses"."asset"
    FROM
      (SELECT "address", "asset"
      FROM "Outputs"
      WHERE "Outputs"."asset" LIKE :assetSearch
      GROUP BY "Outputs"."asset", "Outputs"."address") AS "UniqueAddresses"
    GROUP BY "UniqueAddresses"."asset") AS "Keyholders"
    ON "Issued"."asset" = "Keyholders"."asset"
    LIMIT :limit OFFSET :offset
  `;

  return sequelize.query(sql, {
    replacements: {
      assetSearch: `${id}%`,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

contractsDAL.setExpired = function(ids = []) {
  if (!ids.length) {
    return Promise.resolve();
  }

  return this.db[this.model].update(
    {
      expiryBlock: null,
    },
    {
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    }
  );
};

module.exports = contractsDAL;
