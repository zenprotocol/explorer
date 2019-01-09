'use strict';

const httpStatus = require('http-status');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const contractsBLL = require('./contractsBLL');
const contractsDAL = require('./contractsDAL');

module.exports = {
  index: async function(req, res) {
    const { page, pageSize, sorted, blockNumber } = req.query;
    const contracts = await contractsBLL.findAll({ page, pageSize, sorted, blockNumber });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, contracts));
  },
  show: async function(req, res) {
    const { address } = req.params;
    if (!address) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const contract = await contractsBLL.findByAddress({ address });
    if (contract) {
      const lastActivationTransaction = await contractsBLL.findLastActivationTransaction({
        contract,
      });
      res
        .status(httpStatus.OK)
        .json(
          jsonResponse.create(
            httpStatus.OK,
            Object.assign({}, contractsDAL.toJSON(contract), { lastActivationTransaction })
          )
        );
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  assets: async function(req, res) {
    const { address } = req.params;
    const { page, pageSize } = req.query;
    if (!address) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const assets = await contractsBLL.assets({ address, page, pageSize });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, assets));
  },
  commands: async function(req, res) {
    const { address } = req.params;
    const { page, pageSize } = req.query;
    if (!address) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const commands = await contractsBLL.commands({ address, page, pageSize });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, commands));
  },
};
