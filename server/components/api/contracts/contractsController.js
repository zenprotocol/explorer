'use strict';

const httpStatus = require('http-status');
const contractsDAL = require('./contractsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  index: async function(req, res) {
    const contracts = await contractsDAL.findAll();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, contracts)
    );
  },
  show: async function(req, res) {
    if(!req.params.id) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const contract = await contractsDAL.findById(req.params.id);
    if (contract) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, contract));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
