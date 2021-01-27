'use strict';

const { Decimal } = require('decimal.js');
const txsDAL = require('../txs/txsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const txsPerDayDAL = require('../txs-per-day/txsPerDayDAL');
const zpSupplyPerDayDAL = require('../zp-supply-per-day/zpSupplyPerDayDAL');
const difficultyPerDayDAL = require('../difficulty-per-day/difficultyPerDayDAL');
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

statsDAL.transactionsPerDay = async function ({ chartInterval = maximumChartInterval, transaction } = {}) {
  return txsPerDayDAL.findAll({
    where: {
      date: {
        [Op.lt]: db.Sequelize.literal('CURRENT_DATE'),
        [Op.gt]: db.Sequelize.literal(`CURRENT_DATE - '${chartInterval}'::interval`),
      },
    },
    order: [['date', 'ASC']],
    transaction
  });
};

statsDAL.zpSupply = async function ({ chartInterval = maximumChartInterval, transaction } = {}) {
  return zpSupplyPerDayDAL.findAll({
    where: {
      date: {
        [Op.lt]: db.Sequelize.literal('CURRENT_DATE'),
        [Op.gt]: db.Sequelize.literal(`CURRENT_DATE - '${chartInterval}'::interval`),
      },
    },
    order: [['date', 'ASC']],
    transaction
  });
};

statsDAL.blockDifficulty = async function ({ chartInterval = maximumChartInterval, transaction } = {}) {
  return difficultyPerDayDAL.findAll({
    where: {
      date: {
        [Op.lt]: db.Sequelize.literal('CURRENT_DATE'),
        [Op.gt]: db.Sequelize.literal(`CURRENT_DATE - '${chartInterval}'::interval`),
      },
    },
    order: [['date', 'ASC']],
    transaction
  });
};

statsDAL.networkHashRate = async function ({
  chartInterval = maximumChartInterval,
  transaction,
} = {}) {
  return difficultyPerDayDAL.findAll({
    attributes: ['date', [db.Sequelize.literal('value * 1000000000000 / 55000'), 'value']],
    where: {
      date: {
        [Op.lt]: db.Sequelize.literal('CURRENT_DATE'),
        [Op.gt]: db.Sequelize.literal(`CURRENT_DATE - '${chartInterval}'::interval`),
      },
    },
    order: [['date', 'ASC']],
    transaction,
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
      attributes: { include: [[sequelize.literal('balance / 100000000.0'), 'balanceZp']] },
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
