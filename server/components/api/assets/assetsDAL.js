'use strict';

const dal = require('../../../lib/dal');
const addressesDAL = require('../addresses/addressesDAL');

const assetsDAL = dal.createDAL('Asset');
const sequelize = assetsDAL.db.sequelize;
const Op = assetsDAL.db.Sequelize.Op;

assetsDAL.keyholders = function ({ asset, limit, offset } = {}) {
  if (!asset) {
    return this.getItemsAndCountResult([0, []]);
  }

  return addressesDAL.keyholders({ asset, limit, offset });
};

assetsDAL.search = async function (search, limit = 10) {
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

/**
 * Calculates issued/destroyed/outstanding for all assets except ZP
 */
assetsDAL.snapshotCurrentAmountsForAll = async function ({ dbTransaction } = {}) {
  // sql includes comments, not using tags.oneLine
  const sql = `
  SELECT
    COALESCE(osums.asset, isums.asset) AS asset,
    COALESCE(osums."destroyed", 0) AS destroyed,
    COALESCE(isums."issued", 0) AS issued,
    COALESCE(isums."issued", 0) - COALESCE(osums."destroyed", 0) AS outstanding
  FROM
    ( 
      -- destroyed
      SELECT
        o.asset,
        SUM(o.amount) AS destroyed
      FROM "Outputs" o
      WHERE o.asset IS NOT NULL AND o.asset != '00' AND o."lockType" = 'Destroy'
      GROUP BY o.asset
    ) AS osums
    FULL OUTER JOIN
    ( 
      -- mints
      SELECT
        i.asset,
        SUM(i.amount) AS issued
      FROM "Inputs" i
      WHERE i.asset IS NOT NULL AND i.asset != '00' AND i."isMint" = TRUE
      GROUP BY i.asset
    ) AS isums
    ON osums.asset = isums.asset;
  `;

  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};

/**
 * Calculates issued/destroyed/outstanding for ZP
 */
assetsDAL.snapshotCurrentAmountsForZP = async function ({ dbTransaction } = {}) {
  // sql includes comments, not using tags.oneLine
  const sql = `
  SELECT
    '00' AS asset,
    COALESCE(destroyed.amount, 0) AS destroyed,
    COALESCE(issued.amount, 0) AS issued,
    COALESCE(issued.amount, 0) - COALESCE(destroyed.amount, 0) AS outstanding
  FROM
    ( 
      -- destroyed
      SELECT
        o.asset,
        SUM(o.amount) AS amount
      FROM "Outputs" o
      WHERE o.asset = '00' AND o."lockType" = 'Destroy'
      GROUP BY o.asset
    ) AS destroyed
    FULL OUTER JOIN
    ( 
      -- issued
      SELECT
        '00' AS asset,
        SUM(b.reward) AS amount
      FROM "Blocks" b
    ) AS issued
    ON destroyed.asset = issued.asset;
  `;

  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  }).then(results => results.length ? results[0] : null);
};

assetsDAL.countTxsPerAsset = async function ({ dbTransaction }) {
  const sql = `
  SELECT
    ins_outs.asset AS asset,
    COUNT(*) AS "txsCount"
  FROM
    ( 
      -- combine inputs and outputs
      SELECT
        COALESCE(outs.asset, ins.asset) AS asset,
        COALESCE(outs."txId", ins."txId") AS "txId"
      FROM
        ( 
          -- outputs per TX
          SELECT
            o.asset,
            o."txId"
          FROM "Outputs" o
          WHERE o.asset IS NOT NULL AND o."lockType" IN ('Coinbase','PK','Contract','Destroy')
          GROUP BY o.asset, o."txId"
        ) AS outs
        FULL OUTER JOIN
        ( -- inputs per TX
          SELECT
            io.asset,
            i."txId"
          FROM
            "Outputs" io
            INNER JOIN "Inputs" i ON i."outputId" = io.id
          WHERE io.asset IS NOT NULL AND io."lockType" IN ('Coinbase','PK','Contract','Destroy')
          GROUP BY io.asset, i."txId"
        ) AS ins
        ON outs.asset = ins.asset 
          AND outs."txId" = ins."txId"
    ) AS ins_outs
  GROUP BY ins_outs.asset;
  `;

  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};

/**
 * Calculate and insert all unique asset transactions from Inputs and Outputs
 */
assetsDAL.insertAllAssetTxs = async function ({ dbTransaction } = {}) {
  // sql includes comments, not using tags.oneLine
  const sql = `
  INSERT INTO "AssetTxs"
  SELECT
    -- fields must be in the same order as defined in "AssetTxs"
    COALESCE(osums."blockNumber", isums."blockNumber") AS "blockNumber",
    COALESCE(osums."txId", isums."txId") AS "txId",
    COALESCE(osums.asset, isums.asset) AS asset
  FROM
    ( 
      -- outputs per TX
      SELECT
        o.asset,
        o."txId",
        o."blockNumber"
      FROM "Outputs" o
      WHERE o.asset IS NOT NULL AND o."lockType" IN ('Coinbase','PK','Contract','Destroy')
      GROUP BY o.asset, o."txId", o."blockNumber"
    ) AS osums
    FULL OUTER JOIN
    ( -- inputs per TX
      SELECT
        io.asset,
        i."txId",
        i."blockNumber"
      FROM
        "Outputs" io
        INNER JOIN "Inputs" i ON i."outputId" = io.id
      WHERE io.asset IS NOT NULL AND io."lockType" IN ('Coinbase','PK','Contract','Destroy')
      GROUP BY io.asset, i."txId", i."blockNumber"
    ) AS isums
    ON osums.asset = isums.asset 
      AND osums."txId" = isums."txId";
  `;

  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};

module.exports = assetsDAL;
