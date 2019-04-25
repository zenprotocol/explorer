'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize
      .query(
        `
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
      `
      )
      .then(() =>
        queryInterface.addIndex('ZpTransactions', {
          fields: ['transactionId'],
          unique: true,
          name: 'ZpTransactions_transactionId_index',
        })
      );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('DROP MATERIALIZED VIEW "ZpTransactions";');
  },
};
