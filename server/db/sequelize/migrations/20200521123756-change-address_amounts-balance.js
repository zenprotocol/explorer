'use strict';

const LOCK_TYPE_FOR_BALANCE = '"lockType" = ANY(\'{"Coinbase","PK","Contract","Destroy"}\')';

/**
 * This migration counts the balance only by the lock types mentioned above
 */

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW "AddressAmounts";').then(() =>
      queryInterface.sequelize
        .query(
          `
          CREATE MATERIALIZED VIEW "AddressAmounts"
          AS
          SELECT
            bothsums.asset AS asset,
            bothsums.address AS address,
            (output_sum - input_sum) AS balance,
            output_sum AS received,
            input_sum AS sent
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
              WHERE o.address IS NOT NULL AND o.${LOCK_TYPE_FOR_BALANCE}
              GROUP BY asset, address) AS osums
              FULL OUTER JOIN
              (SELECT
                io.address,
                io.asset,
                SUM(io.amount) AS input_sum
              FROM
                "Outputs" io
                JOIN "Inputs" i
                ON i."OutputId" = io.id
              WHERE io.address IS NOT NULL AND io.${LOCK_TYPE_FOR_BALANCE}
              GROUP BY io.asset, io.address) AS isums
              ON osums.address = isums.address AND osums.asset = isums.asset) AS bothsums
          ORDER BY asset, balance DESC;
          `
        )
        .then(() =>
          queryInterface.addIndex('AddressAmounts', {
            fields: ['address', 'asset'],
            unique: true,
            name: 'AddressAmounts_address_asset_index',
          })
        )
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW "AddressAmounts";').then(() =>
      queryInterface.sequelize
        .query(
          `
          CREATE MATERIALIZED VIEW "AddressAmounts"
          AS
          SELECT
            bothsums.asset AS asset,
            bothsums.address AS address,
            (output_sum - input_sum) AS balance,
            output_sum AS received,
            input_sum AS sent
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
              WHERE o.address IS NOT NULL
              GROUP BY asset, address) AS osums
              FULL OUTER JOIN
              (SELECT
                io.address,
                io.asset,
                SUM(io.amount) AS input_sum
              FROM
                "Outputs" io
                JOIN "Inputs" i
                ON i."OutputId" = io.id
              WHERE io.address IS NOT NULL
              GROUP BY io.asset, io.address) AS isums
              ON osums.address = isums.address AND osums.asset = isums.asset) AS bothsums
          ORDER BY asset, balance DESC;
          `
        )
        .then(() =>
          queryInterface.addIndex('AddressAmounts', {
            fields: ['address', 'asset'],
            unique: true,
            name: 'AddressAmounts_address_asset_index',
          })
        )
    );
  },
};
