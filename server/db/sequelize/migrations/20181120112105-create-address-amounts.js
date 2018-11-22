'use strict';
/**
 * Drop ZpAddressAmounts and create instead a generalized AddressAmounts
 * AddressAmounts contains all assets and all addresses, even those with balance = 0
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW "ZpAddressAmounts";').then(() =>
      queryInterface.sequelize.query(
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
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW "AddressAmounts";').then(() =>
      queryInterface.sequelize.query(
        `
          CREATE MATERIALIZED VIEW "ZpAddressAmounts"
          AS 
          select
              (output_sum - input_sum) as balance,
              bothsums.address as address
          from
            (select
              coalesce(osums.address, isums.address) as address,
              osums.output_sum,
              case
              when isums.input_sum is null
              then 0
              else isums.input_sum
              end
            from
              (select
                o.address,
                sum(o.amount) as output_sum
              from "Outputs" o
              where o.asset = '00'
              and o.address is not null
              group by address) as osums
              full outer join
              (select
                io.address,
                sum(io.amount) as input_sum
              from
                "Outputs" io
                join "Inputs" i
                on i."OutputId" = io.id
              where io.asset = '00' and io.address is not null
              group by io.address) as isums
              on osums.address = isums.address) as bothsums
            where output_sum <> input_sum
          order by balance desc;
          `
      )
    );
  },
};
