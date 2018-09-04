'use strict';

const httpStatus = require('http-status');
const infosDAL = require('./infosDAL');
const transactionsDAL = require('../transactions/transactionsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  index: async function(req, res) {
    const [allItems, transactionsCount] = await Promise.all([
      infosDAL.findAll({ attributes: ['name', 'value'] }),
      transactionsDAL.count(),
    ]);

    const items = allItems.reduce((all, cur) => {
      all[cur.name] = cur.value;
      return all;
    }, {});

    items.transactions = transactionsCount;

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, items)
    );
  },
  show: async function(req, res) {
    const info = await infosDAL.findByName(req.params.name);
    if (info) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, info));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
