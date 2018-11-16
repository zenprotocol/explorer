'use strict';

const tags = require('common-tags');
const transactionsDAL = require('../transactions/transactionsDAL');
const blocksDAL = require('../blocks/blocksDAL');
const inputsDAL = require('../inputs/inputsDAL');
const zpAddressAmountsDAL = require('../zpAddressAmounts/zpAddressAmountsDAL');
const sqlQueries = require('../../../lib/sqlQueries');
const db = transactionsDAL.db;
const sequelize = db.sequelize;

const statsDAL = {};
const maximumChartInterval = '1 year';

statsDAL.totalZp = async function() {
  const blocksCount = await blocksDAL.count();
  return 20000000 + (blocksCount - 1) * 50;
};

statsDAL.totalIssued = async function(asset) {
  return inputsDAL.sum('amount', {
    where: {
      [db.sequelize.Op.and]: {
        asset,
        isMint: true,
      },
    },
  });
};

statsDAL.transactionsPerDay = async function({ chartInterval = maximumChartInterval } = {}) {
  const sql = tags.oneLine`
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

statsDAL.blockDifficulty = async function({ chartInterval = maximumChartInterval } = {}) {
  const sql = tags.oneLine`
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

statsDAL.networkHashRate = async function({ chartInterval = maximumChartInterval } = {}) {
  const sql = tags.oneLine`
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
  return Promise.all([
    zpAddressAmountsDAL.findAll({
      attributes: {include: [[sequelize.literal('balance / 100000000'), 'balanceZp']]},
      limit: 100, offset: 0
    }), 
    this.totalZp()]).then(
    ([chartData, totalZp]) => {
      let restZp = chartData.reduce((restAmount, curItem) => {
        return restAmount - Number(curItem.balance);
      }, Number(totalZp));

      chartData.push({
        balance: String(restZp),
        address: 'Rest',
      });

      return chartData;
    }
  );
};

statsDAL.assetDistributionMap = async function({ asset } = {}) {
  if (!asset) {
    return [];
  }

  return Promise.all([this.distributionMap(asset, 1), this.totalIssued(asset)]).then(
    ([chartData, total]) => {
      let rest = chartData.reduce((restAmount, curItem) => {
        return restAmount - Number(curItem.balance);
      }, Number(total));

      if (rest > 0) {
        chartData.push({
          balance: String(rest),
          address: 'Rest',
        });
      }

      return chartData;
    }
  );
};

statsDAL.distributionMap = async function(asset = '00', divideBy = 1, limit = 100, offset = 0) {
  const sql = tags.oneLine`
  select
    (output_sum - input_sum) / :divideBy as balance,
    bothsums.address as address
  from
    ${sqlQueries.distributionMapFrom}
  order by balance desc
  limit :limit offset :offset
  `;
  return sequelize.query(sql, {
    replacements: {
      asset,
      divideBy,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

statsDAL.distributionMapCount = async function(asset) {
  const sql = tags.oneLine`
  select
    count(bothsums.address)
  from
    ${sqlQueries.distributionMapFrom}
  `;
  return sequelize
    .query(sql, {
      replacements: {
        asset,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(result => (result.length ? result[0].count : 0));
};

statsDAL.zpSupply = async function({ chartInterval = maximumChartInterval } = {}) {
  const sql = tags.oneLine`
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
