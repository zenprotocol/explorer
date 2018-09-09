'use strict';

const transactionsDAL = require('../transactions/transactionsDAL');
const db = transactionsDAL.db;
const sequelize = db.sequelize;

const statsDAL = {};

statsDAL.transactionsPerDay = async function() {
  const sql = `
  SELECT COUNT("Transactions"."id"), "Blocks"."dt"
  FROM "Transactions"
    INNER JOIN (SELECT CAST(to_timestamp("Blocks"."timestamp" / 1000) AS DATE) AS dt, *
    FROM "Blocks") AS "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
  WHERE "Blocks"."dt" > CURRENT_DATE - interval '1 year'
  GROUP BY "Blocks"."dt"
  ORDER BY "Blocks"."dt"
  `;
  return sequelize
    .query(sql, {
      type: sequelize.QueryTypes.SELECT,
    });
};

module.exports = statsDAL;