'use strict';

const tags = require('common-tags');
const { Decimal } = require('decimal.js');
const txsDAL = require('../txs/txsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const txsPerDayDAL = require('../txs-per-day/txsPerDayDAL');
const zpSupplyPerDayDAL = require('../zp-supply-per-day/zpSupplyPerDayDAL');
const db = txsDAL.db;
const sequelize = db.sequelize;
const Op = db.Sequelize.Op;

const statsDAL = {};
const maximumChartInterval = '1 year';

statsDAL.totalIssued = async function (asset) {
  return inputsDAL.sum('amount', {
    where: {
      [db.Sequelize.Op.and]: {
        asset,
        isMint: true,
      },
    },
  });
};

statsDAL.transactionsPerDay = async function ({ chartInterval = maximumChartInterval } = {}) {
  return txsPerDayDAL.findAll({
    where: {
      date: {
        [Op.lte]: db.Sequelize.literal('CURRENT_DATE'),
        [Op.gt]: db.Sequelize.literal(`CURRENT_DATE - '${chartInterval}'::interval`),
      },
    },
  });
};

statsDAL.zpSupply = async function ({ chartInterval = maximumChartInterval } = {}) {
  return zpSupplyPerDayDAL.findAll({
    where: {
      date: {
        [Op.lte]: db.Sequelize.literal('CURRENT_DATE'),
        [Op.gt]: db.Sequelize.literal(`CURRENT_DATE - '${chartInterval}'::interval`),
      },
    },
  });
};

statsDAL.blockDifficulty = async function ({ chartInterval = maximumChartInterval } = {}) {
  const sql = tags.oneLine`
  with t_vals as
  (select timestamp as tsp, "blockNumber" as block_number, least (greatest ((difficulty >> 24), 3), 32) as lnth, (difficulty & x'00FFFFFF' :: int) as mantissa from "Blocks")
  , i_vals as
  (select date_trunc('day',to_timestamp(0) + tsp * interval '1 millisecond') as block_date, ((x'1000000' :: int) :: real / (mantissa :: real)) * 256 ^ (32 - lnth) as expected_hashes, block_number from t_vals)

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

statsDAL.networkHashRate = async function ({ chartInterval = maximumChartInterval } = {}) {
  const sql = tags.oneLine`
  with t_vals as
  (select timestamp as tsp, "blockNumber" as block_number, least (greatest ((difficulty >> 24), 3), 32) as lnth, (difficulty & x'00FFFFFF' :: int) as mantissa from "Blocks")
  , i_vals as
  (select date_trunc('day',to_timestamp(0) + tsp * interval '1 millisecond') as block_date, ((x'1000000' :: int) :: real / (mantissa :: real)) * 256 ^ (32 - lnth) as expected_hashes, block_number from t_vals)
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

statsDAL.zpRichList = async function ({ totalZpK } = {}) {
  return addressesDAL
    .findAll({
      where: {
        asset: '00',
        balance: {
          [Op.gt]: 0,
        },
      },
      attributes: { include: [[sequelize.literal('balance / 100000000'), 'balanceZp']] },
      order: [['balance', 'DESC']],
      limit: 100,
      offset: 0,
    })
    .then((chartData) => {
      const restKalapas = chartData.reduce((restAmount, curItem) => {
        return restAmount.minus(curItem.balance);
      }, new Decimal(totalZpK));
      const restZp = restKalapas.div(100000000);
      chartData.push({
        balance: restKalapas.toString(),
        balanceZp: restZp.toFixed(8),
        address: 'Rest',
      });

      return chartData;
    });
};

statsDAL.assetDistributionMap = async function ({ asset } = {}) {
  if (!asset) {
    return [];
  }

  return Promise.all([
    addressesDAL.keyholders({ asset, limit: 100 }),
    this.totalIssued(asset),
  ]).then(([chartData, total]) => {
    const items = chartData.items;
    let rest = items.reduce((restAmount, curItem) => {
      return restAmount - Number(curItem.balance);
    }, Number(total));

    if (rest > 0) {
      items.push({
        balance: String(rest),
        address: 'Rest',
      });
    }

    return items;
  });
};

module.exports = statsDAL;
