'use strict';

const httpStatus = require('http-status');
const outputsDAL = require('./outputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');

module.exports = {
  index: async function(req, res) {
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'createdAt', desc: true }];

    const query = createQueryObject({sorted});
    const [count, allItems] = await Promise.all([outputsDAL.count(), outputsDAL.findAll(query)]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allItems,
        total: count,
      })
    );
  },
  show: async function(req, res) {
    const output = await outputsDAL.findById(req.params.id);
    if (output) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, output));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  create: async function(req, res) {
    const output = await outputsDAL.create(req.body);
    res.status(httpStatus.CREATED).json(jsonResponse.create(httpStatus.CREATED, output));
  },
  update: async function(req, res) {
    const output = await outputsDAL.update(req.params.id, req.body);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, output));
  },
  delete: async function(req, res) {
    await outputsDAL.delete(req.params.id);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK));
  },
};
