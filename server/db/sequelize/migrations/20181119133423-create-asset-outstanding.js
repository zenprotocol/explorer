'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(
      `
        CREATE MATERIALIZED VIEW "AssetOutstandings"
        AS 
        SELECT
          COALESCE("Issued"."asset", "Destroyed"."asset") AS "asset",
          COALESCE("Issued"."sum", 0) AS "issued",
          COALESCE("Destroyed"."sum", 0) AS "destroyed",
          COALESCE("Issued"."sum", 0) -  COALESCE("Destroyed"."sum", 0) AS "outstanding",
          COALESCE("Keyholders"."total", 0) AS "keyholders"
        FROM
          -- Issued
          (SELECT asset, SUM("amount") AS sum
          FROM "Inputs"
          WHERE "Inputs"."isMint" = 'true' AND "Inputs"."asset" <> '00'
          GROUP BY "Inputs"."asset") AS "Issued"
          LEFT JOIN
          -- Destroyed
          (SELECT asset, SUM("amount") AS sum
          FROM "Outputs"
          WHERE "Outputs"."lockType" = 'Destroy' AND "Outputs"."asset" <> '00'
          GROUP BY "Outputs"."asset") AS "Destroyed"
          ON "Issued"."asset" = "Destroyed"."asset"
          LEFT JOIN
          -- Keyholders
          (SELECT
            COUNT(bothsums.address) AS total,
            bothsums.asset AS asset
          FROM 
            (SELECT
              COALESCE(osums.address, isums.address) AS address,
              COALESCE(osums.asset, isums.asset) AS asset,
              osums.output_sum,
              CASE
              WHEN isums.input_sum IS NULL
              THEN 0
              ELSE isums.input_sum
              END
            FROM
              (SELECT
                o.address,
                o.asset,
                SUM(o.amount) AS output_sum
              FROM "Outputs" o
              WHERE o.asset <> '00' AND o.address IS NOT NULL
              GROUP BY address, asset) AS osums
              FULL OUTER JOIN
              (SELECT
                io.address,
                io.asset,
                SUM(io.amount) AS input_sum
              FROM
                "Outputs" io
                JOIN "Inputs" i
                ON i."OutputId" = io.id
              WHERE io.asset <> '00' AND io.address IS NOT NULL
              GROUP BY io.address, io.asset) AS isums
              ON osums.address = isums.address AND osums.asset = isums.asset) AS bothsums
          WHERE output_sum <> input_sum
          GROUP BY bothsums.asset
            ) AS "Keyholders"
          ON "Issued"."asset" = "Keyholders"."asset"
        `
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW "AssetOutstandings";');
  },
};
