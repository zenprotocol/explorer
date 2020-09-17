'use strict';

const httpStatus = require('http-status');
const { Decimal } = require('decimal.js');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const blocksBLL = require('../blocks/blocksBLL');
const statsDAL = require('./statsDAL');

const STATS = ['totalzp', 'totalkalapa'];
const CHARTS = [
  'transactionsPerDay',
  'blockDifficulty',
  'networkHashRate',
  'zpRichList',
  'assetDistributionMap',
  'zpSupply',
];

const StatsFunctions = {
  totalZp: async function () {
    return new Decimal(await blocksBLL.getTotalZp()).dividedBy(100000000).toFixed(8);
  },
  totalKalapa: async function () {
    return await blocksBLL.getTotalZp();
  },
};

module.exports = {
  index: async function (req, res) {
    const totalZP = await StatsFunctions.totalZp();
    const totalKalapa = await StatsFunctions.totalKalapa();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        totalZP,
        totalKalapa,
      })
    );
  },
  show: async function (req, res) {
    let name = req.params.name || '';
    name = name.toLowerCase().trim();
    if (!name || !STATS.includes(name)) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }

    let stat = null;
    switch (name) {
      case 'totalzp':
        stat = await StatsFunctions.totalZp();
        break;
      case 'totalkalapa':
        stat = await StatsFunctions.totalKalapa();
        break;
    }

    res.status(httpStatus.OK).json(stat);
  },
  charts: async function (req, res) {
    let name = req.params.name || '';
    name = name.trim();
    if (!name || !CHARTS.includes(name)) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
    const params = req.query;
    if (name === 'zpRichList') {
      params.totalZpK = await StatsFunctions.totalKalapa();
    }

    const data = await statsDAL[name](params);

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, data));
  },
};
