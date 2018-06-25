'use strict';

const httpStatus = require('http-status');
const blocksDAL = require('./blocksDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');

module.exports = {
  index: async function(req, res) {
    const allBlocks = await blocksDAL.findAll({
      order: [
        ['blockNumber', 'DESC']
      ]
    });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, allBlocks));
  },
  show: async function(req, res) {
    const block = await blocksDAL.findById(req.params.id);
    if(block) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, block));
    }
    else {
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
