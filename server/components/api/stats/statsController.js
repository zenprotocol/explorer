'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const blocksDAL = require('../blocks/blocksDAL');

const STATS = ['totalzp', 'totalkalapa'];

const StatsFunctions = {
  totalZp: async function() {
    const blocksCount = await blocksDAL.count();
    return 20000000 + (blocksCount - 1) * 50;
  },
  totalKalapa: async function() {
    return (await this.totalZp()) * 100000000;
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
};
