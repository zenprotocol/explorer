'use strict';

const transactionsDAL = require('../transactions/transactionsDAL');
const db = transactionsDAL.db;
const sequelize = db.sequelize;

const statsDAL = {};
const maximumChartInterval = '1 year';

statsDAL.transactionsPerDay = async function() {
  const sql = `
  SELECT COUNT("Transactions"."id"), "Blocks"."dt"
  FROM "Transactions"
    INNER JOIN (SELECT CAST(to_timestamp("Blocks"."timestamp" / 1000) AS DATE) AS dt, *
    FROM "Blocks") AS "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
  WHERE "Blocks"."dt" > CURRENT_DATE - interval '${maximumChartInterval}'
  GROUP BY "Blocks"."dt"
  ORDER BY "Blocks"."dt"
  `;
  return sequelize
    .query(sql, {
      type: sequelize.QueryTypes.SELECT,
    });
};

statsDAL.blockDifficulty = async function() {
  const sql = `
  SELECT FLOOR(AVG("Blocks"."difficulty")) AS difficulty, "dt"
  FROM
    (SELECT CAST(to_timestamp("Blocks"."timestamp" / 1000) AS DATE) AS dt, *
    FROM "Blocks") AS "Blocks"
  WHERE "dt" > CURRENT_DATE - interval '${maximumChartInterval}'
  GROUP BY "dt"
  ORDER BY "dt"
  `;
  return sequelize
    .query(sql, {
      type: sequelize.QueryTypes.SELECT,
    });
};

statsDAL.networkHashrate = async function() {
  const sql = `
  SELECT AVG("Blocks"."difficulty") / 55000 AS hashrate, "dt"
  FROM
    (SELECT CAST(to_timestamp("Blocks"."timestamp" / 1000) AS DATE) AS dt, *
    FROM "Blocks") AS "Blocks"
  WHERE "dt" > CURRENT_DATE - interval '${maximumChartInterval}'
  GROUP BY "dt"
  ORDER BY "dt"
  `;
  return sequelize
    .query(sql, {
      type: sequelize.QueryTypes.SELECT,
    });
};

statsDAL.zpRichList = async function() {
  const sql = `
  select
  (output_sum - input_sum) / 100000000 as balance,
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
      group by address) as osums
      full outer join
      (select
        io.address,
        sum(io.amount) as input_sum
      from
        "Outputs" io
        join "Inputs" i
        on i."OutputId" = io.id
      where io.asset = '00'
      group by io.address) as isums
      on osums.address = isums.address) as bothsums
  where output_sum <> input_sum
  order by balance desc
  limit 100
  `;
  return sequelize
    .query(sql, {
      type: sequelize.QueryTypes.SELECT,
    });
};

module.exports = statsDAL;