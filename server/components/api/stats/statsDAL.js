'use strict';

const transactionsDAL = require('../transactions/transactionsDAL');
const blocksDAL = require('../blocks/blocksDAL');
const db = transactionsDAL.db;
const sequelize = db.sequelize;

const statsDAL = {};
const maximumChartInterval = '1 year';

statsDAL.totalZp = async function() {
  const blocksCount = await blocksDAL.count();
  return 20000000 + (blocksCount - 1) * 50;
};

statsDAL.transactionsPerDay = async function(chartInterval = maximumChartInterval) {
  const sql = `
  SELECT COUNT("Transactions"."id"), "Blocks"."dt"
  FROM "Transactions"
    INNER JOIN (SELECT CAST(to_timestamp("Blocks"."timestamp" / 1000) AS DATE) AS dt, *
    FROM "Blocks") AS "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
  WHERE "Blocks"."dt" < CURRENT_DATE AND "Blocks"."dt" > CURRENT_DATE - interval :chartInterval
  GROUP BY "Blocks"."dt"
  ORDER BY "Blocks"."dt"
  `;
  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      chartInterval,
    },
  });
};

statsDAL.blockDifficulty = async function(chartInterval = maximumChartInterval) {
  const sql = `
  with t_vals as
  (select id, timestamp as tsp, "blockNumber" as block_number, least (greatest ((difficulty >> 24), 3), 32) as lnth, (difficulty & x'00FFFFFF' :: int) as mantissa from "Blocks")
  , i_vals as
  (select id, date_trunc('day',to_timestamp(0) + tsp * interval '1 millisecond') as block_date, ((x'1000000' :: int) :: real / (mantissa :: real)) * 256 ^ (32 - lnth) as expected_hashes, block_number from t_vals)
  select block_date as "dt", (sum(expected_hashes) / 86400.0) * 55000 / 1000000000000 as "difficulty" from i_vals
  where block_date < (select max(block_date) from i_vals) and now() - block_date < interval :chartInterval
  group by block_date
  order by block_date asc offset 1
  `;
  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      chartInterval,
    },
  });
};

statsDAL.networkHashRate = async function(chartInterval = maximumChartInterval) {
  const sql = `
  with t_vals as
  (select id, timestamp as tsp, "blockNumber" as block_number, least (greatest ((difficulty >> 24), 3), 32) as lnth, (difficulty & x'00FFFFFF' :: int) as mantissa from "Blocks")
  , i_vals as
  (select id, date_trunc('day',to_timestamp(0) + tsp * interval '1 millisecond') as block_date, ((x'1000000' :: int) :: real / (mantissa :: real)) * 256 ^ (32 - lnth) as expected_hashes, block_number from t_vals)
  select block_date as "dt", sum(expected_hashes) / 86400.0 as "hashrate" from i_vals
  where block_date < (select max(block_date) from i_vals) and now() - block_date < interval :chartInterval
  group by block_date
  order by block_date asc offset 1
  `;
  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      chartInterval,
    },
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
  return Promise.all([
    sequelize.query(sql, {
      type: sequelize.QueryTypes.SELECT,
    }),
    statsDAL.totalZp(),
  ]).then(([chartData, totalZp]) => {
    let restZp = chartData.reduce((restAmount, curItem) => {
      return restAmount - Number(curItem.balance);
    }, Number(totalZp));
    
    chartData.push({
      balance: String(restZp),
      address: 'Rest',
    });

    return chartData;
  });
};

statsDAL.zpSupply = async function(chartInterval = maximumChartInterval) {
  const sql = `
  SELECT (MAX("Blocks"."blockNumber") * 50 + 20000000) AS supply, "dt"
  FROM
    (SELECT CAST(to_timestamp("Blocks"."timestamp" / 1000) AS DATE) AS dt, *
    FROM "Blocks") AS "Blocks"
  WHERE "dt" < CURRENT_DATE AND "dt" > CURRENT_DATE - interval :chartInterval
  GROUP BY "dt"
  ORDER BY "dt"
  `;
  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    replacements: {
      chartInterval,
    },
  });
};

module.exports = statsDAL;
