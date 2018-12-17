'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const infosBLL = require('./infosBLL');

module.exports = {
  index: async function(req, res) {
    const items = await infosBLL.findAll();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, items)
    );
  },
  show: async function(req, res) {
    const info = await infosBLL.findByName({name: req.params.name});
    if (info) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, info));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
