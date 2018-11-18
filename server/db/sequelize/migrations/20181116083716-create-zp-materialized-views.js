'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .query(
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
      .then(() =>
        queryInterface.sequelize.query(`
    CREATE MATERIALIZED VIEW "ZpTransactions"
    AS 
    SELECT 
      '00' AS "asset",
      COALESCE("Outputs"."outputSum", 0) AS "outputSum",
      COALESCE("Inputs"."inputSum", 0) AS "inputSum",
      COALESCE("outputSum", 0) -  COALESCE("inputSum", 0) AS "totalSum",
      "Transaction"."id" as "transactionId",
      "Transaction"."hash" AS "hash",
      "Block"."timestamp" AS "timestamp",
      "Block"."blockNumber" AS "blockNumber"
    FROM
      (SELECT "TransactionId", SUM("Outputs"."amount") as "outputSum"
        FROM "Outputs" 
        WHERE "Outputs"."asset" = '00'
        GROUP BY "TransactionId") AS "Outputs"
      FULL OUTER JOIN 
      (SELECT "Inputs"."TransactionId", SUM("Outputs"."amount") AS "inputSum"
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."OutputId" = "Outputs"."id" 
        AND "Outputs"."asset" = '00'
        GROUP BY "Inputs"."TransactionId" ) AS "Inputs"
      ON "Outputs"."TransactionId" = "Inputs"."TransactionId"
      INNER JOIN "Transactions" AS "Transaction" ON "Outputs"."TransactionId" = "Transaction"."id" OR "Inputs"."TransactionId" = "Transaction"."id"
      INNER JOIN "Blocks" AS "Block" ON "Transaction"."BlockId" = "Block"."id"
      ORDER BY "Block"."timestamp" DESC;
    `)
      );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .query('DROP MATERIALIZED VIEW "ZpTransactions";')
      .then(() => queryInterface.sequelize.query('DROP MATERIALIZED VIEW "ZpAddressAmounts";'));
  },
};
