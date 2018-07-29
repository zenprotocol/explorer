'use strict';

const httpStatus = require('http-status');
const blocksDAL = require('./blocksDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');
const getTransactionAssets = require('../transactions/getTransactionAssets');
const isCoinbaseTX = require('../transactions/isCoinbaseTX');

function isHash(value) {
  return String(value).length === 64;
}

module.exports = {
  index: async function(req, res) {
    const page = req.query.page || 0;
    const pageSize = req.query.pageSize;
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'blockNumber', desc: true }];

    const query = createQueryObject({ page, pageSize, sorted });
    query.attributes = {
      include: [
        [
          blocksDAL.db.Sequelize.literal(
            '(SELECT "Blocks"."blockNumber" FROM "Blocks" WHERE "Blocks"."hash" = "Block"."parent" LIMIT 1)'
          ),
          'parentBlockNumber',
        ],
      ],
    };
    const [count, allBlocks] = await Promise.all([blocksDAL.count(), blocksDAL.findAll(query)]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allBlocks,
        total: count,
      })
    );
  },
  show: async function(req, res) {
    const hashOrBlockNumber = req.params.hashOrBlockNumber;
    if (!hashOrBlockNumber || (!isHash(hashOrBlockNumber) && isNaN(hashOrBlockNumber))) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }

    const block = isHash(hashOrBlockNumber)
      ? await blocksDAL.findByHash(hashOrBlockNumber)
      : await blocksDAL.findByBlockNumber(hashOrBlockNumber);

    if (block) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  getById: async function(req, res) {
    const block = await blocksDAL.findById(req.params.id);
    if (block) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  create: async function(req, res) {
    const block = await blocksDAL.create(req.body);
    res.status(httpStatus.CREATED).json(jsonResponse.create(httpStatus.CREATED, block));
  },
  update: async function(req, res) {
    const block = await blocksDAL.update(req.params.id, req.body);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
  },
  delete: async function(req, res) {
    await blocksDAL.delete(req.params.id);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK));
  },
};
