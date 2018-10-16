'use strict';

const httpStatus = require('http-status');
const contractTemplatesDAL = require('./contractTemplatesDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  index: async function(req, res) {
    const templates = await contractTemplatesDAL.findAll();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, templates)
    );
  },
  show: async function(req, res) {
    if(!req.params.id) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const template = await contractTemplatesDAL.findById(req.params.id);
    if (template) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, template));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
