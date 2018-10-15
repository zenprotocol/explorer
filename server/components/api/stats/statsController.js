'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const blocksDAL = require('../blocks/blocksDAL');
const statsDAL = require('./statsDAL');

const STATS = ['totalzp', 'totalkalapa'];
const CHARTS = ['transactionsPerDay', 'blockDifficulty', 'networkHashRate', 'zpRichList', 'zpSupply'];

const StatsFunctions = {
  totalZp: async function() {
    return await statsDAL.totalZp();
  },
  totalKalapa: async function() {
    return Math.floor((await this.totalZp()) * 100000000);
  },
};

module.exports = {
  index: async function(req, res) {
    const totalZP = await StatsFunctions.totalZp();
    const totalKalapa = await StatsFunctions.totalKalapa();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        totalZP,
        totalKalapa,
      })
    );
  },
  show: async function(req, res) {
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
  charts: async function(req, res) {
    let name = req.params.name || '';
    name = name.trim();
    if (!name || !CHARTS.includes(name)) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
    const data = await statsDAL[name]();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, data)
    );
  },
};
