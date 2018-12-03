'use strict';
/**
 * Re create AssetOutstandings and add transactionsCount column
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW "AssetOutstandings";').then(() =>
      queryInterface.sequelize.query(
        `
          CREATE MATERIALIZED VIEW "AssetOutstandings"
          AS
          -- ZP
          SELECT
            '00' AS asset,
            "Issued"."amount" AS issued,
            "Destroyed"."amount" AS destroyed,
            "Issued"."amount" - "Destroyed"."amount" AS outstanding,
            "Keyholders"."total" AS "keyholders",
            "Transactions"."total" AS "transactionsCount"
          FROM
            -- issued
            (SELECT ((20000000 + (COUNT(*) - 1) * 50) * 100000000) as amount
            from "Blocks") AS "Issued",
            -- destroyed
            (SELECT COALESCE(sum("amount"), 0) as amount
            FROM "Outputs"
            WHERE ("Outputs"."asset" = '00' AND "Outputs"."lockType" = 'Destroy')) AS "Destroyed",
            -- keyholders
            (SELECT
              COALESCE(COUNT(*), 0) AS total
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
                WHERE o.asset = '00' AND o.address IS NOT NULL
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
                WHERE io.asset = '00' AND io.address IS NOT NULL
                GROUP BY io.address, io.asset) AS isums
                ON osums.address = isums.address AND osums.asset = isums.asset) AS bothsums
            WHERE output_sum <> input_sum
            GROUP BY bothsums.asset) AS "Keyholders",
            -- Transactions
            (SELECT 
              COALESCE(COUNT(*), 0) AS "total"
            FROM
              (SELECT "TransactionId"
                  FROM "Outputs" 
                  WHERE "Outputs"."asset"  = '00'
                  GROUP BY "TransactionId") AS "Outputs"
                FULL OUTER JOIN (SELECT "Inputs"."TransactionId"
                  FROM "Inputs" JOIN "Outputs" 
                  ON "Inputs"."OutputId" = "Outputs"."id" 
                  AND "Outputs"."asset"  = '00'
                  GROUP BY "Inputs"."TransactionId") AS "Inputs"
                ON "Outputs"."TransactionId" = "Inputs"."TransactionId") AS "Transactions"

          UNION
          -- contract assets
          SELECT
            COALESCE("Issued"."asset", "Destroyed"."asset") AS "asset",
            COALESCE("Issued"."sum", 0) AS "issued",
            COALESCE("Destroyed"."sum", 0) AS "destroyed",
            COALESCE("Issued"."sum", 0) -  COALESCE("Destroyed"."sum", 0) AS "outstanding",
            COALESCE("Keyholders"."total", 0) AS "keyholders",
            COALESCE("Transactions"."total", 0) AS "transactionsCount"
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
            LEFT JOIN
            -- Transactions
            (SELECT 
            COUNT(*) AS "total",
            COALESCE("Outputs"."asset", "Inputs"."asset") AS "asset"
            FROM
              (SELECT "TransactionId", "asset"
                  FROM "Outputs" 
                  WHERE "Outputs"."asset"  != '00'
                  GROUP BY "TransactionId", "asset") AS "Outputs"
                FULL OUTER JOIN (SELECT "Inputs"."TransactionId", "Outputs"."asset"
                  FROM "Inputs" JOIN "Outputs" 
                  ON "Inputs"."OutputId" = "Outputs"."id" 
                  AND "Outputs"."asset"  != '00'
                  GROUP BY "Inputs"."TransactionId", "Outputs"."asset") AS "Inputs"
                ON "Outputs"."TransactionId" = "Inputs"."TransactionId" AND "Outputs"."asset" = "Inputs"."asset"
            GROUP BY COALESCE("Outputs"."asset", "Inputs"."asset")) AS "Transactions"
            ON "Issued"."asset" = "Transactions"."asset"
            
          ORDER BY keyholders DESC;
        `
      )
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW "AssetOutstandings";').then(() =>
      queryInterface.sequelize.query(
        `
          CREATE MATERIALIZED VIEW "AssetOutstandings"
          AS
          -- ZP
          SELECT
            '00' AS asset,
            "Issued"."amount" AS issued,
            "Destroyed"."amount" AS destroyed,
            "Issued"."amount" - "Destroyed"."amount" AS outstanding,
            "Keyholders"."total" AS "keyholders"
          FROM
            -- issued
            (SELECT ((20000000 + (COUNT(*) - 1) * 50) * 100000000) as amount
            from "Blocks") AS "Issued",
            -- destroyed
            (SELECT COALESCE(sum("amount"), 0) as amount
            FROM "Outputs"
            WHERE ("Outputs"."asset" = '00' AND "Outputs"."lockType" = 'Destroy')) AS "Destroyed",
            -- keyholders
            (SELECT
              COUNT(bothsums.address) AS total
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
                WHERE o.asset = '00' AND o.address IS NOT NULL
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
                WHERE io.asset = '00' AND io.address IS NOT NULL
                GROUP BY io.address, io.asset) AS isums
                ON osums.address = isums.address AND osums.asset = isums.asset) AS bothsums
            WHERE output_sum <> input_sum
            GROUP BY bothsums.asset) AS "Keyholders"

          UNION
          -- contract assets
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
            
          ORDER BY keyholders DESC;
        `
      )
    );
  },
};
