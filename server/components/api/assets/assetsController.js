'use strict';

const httpStatus = require('http-status');
const assetsDAL = require('./assetsDAL');
const contractsDAL = require('../contracts/contractsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');

module.exports = {
  show: async function(req, res) {
    const { asset } = req.params;
    if (!asset) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const [assetOutstanding, contract] = await Promise.all([
      assetsDAL.findOutstanding(asset),
      contractsDAL.findById(asset.substring(0, 72)),
    ]);
    if (asset) {
      res
        .status(httpStatus.OK)
        .json(
          jsonResponse.create(
            httpStatus.OK,
            Object.assign({}, assetOutstanding, contract && {
              contract: { id: contract.id, address: contract.address },
            })
          )
        );
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  keyholders: async function(req, res) {
    const { asset } = req.params;
    if (!asset) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const page = req.query.page || 0;
    const pageSize = req.query.pageSize || 10;

    const query = createQueryObject({ page, pageSize });
    const result = await assetsDAL.keyholders(Object.assign({ asset }, query));

    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, result));
  },
};
