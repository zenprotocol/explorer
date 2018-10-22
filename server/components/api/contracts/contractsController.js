'use strict';

const httpStatus = require('http-status');
const contractsDAL = require('./contractsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');

module.exports = {
  index: async function(req, res) {
    const contracts = await contractsDAL.findAll();

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, contracts)
    );
  },
  show: async function(req, res) {
    if(!req.params.address) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const contract = await contractsDAL.findByAddress(req.params.address);
    if (contract) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, contract));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  assets: async function(req, res) {
    if(!req.params.address) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const contract = await contractsDAL.findByAddress(req.params.address);
    if (contract) {
      const page = Number(req.query.page) || 0;
      const pageSize = Number(req.query.pageSize) || 10;

      const query = createQueryObject({ page, pageSize, sorted: [] });
      const assets = await contractsDAL.findAllOutstandingAssets(contract.id, query);
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, assets));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
