'use strict';

const httpStatus = require('http-status');
const infosDAL = require('./infosDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  index: async function(req, res) {
    const allItems = await infosDAL.findAll();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allItems,
      })
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
