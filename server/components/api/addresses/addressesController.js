'use strict';

const httpStatus = require('http-status');
const transactionsDAL = require('../transactions/transactionsDAL');
const outputsDAL = require('../outputs/outputsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');
const getTransactionAssets = require('../transactions/getTransactionAssets');

module.exports = {
  index: async function(req, res) {
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'createdAt', desc: true }];

    const query = createQueryObject({sorted});
    const [count, allItems] = await Promise.all([transactionsDAL.count(), transactionsDAL.findAll(query)]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allItems,
        total: count,
      })
    );
  },
  show: async function(req, res) {
    // const transactions = await transactionsDAL.findAllByAddress(req.params.hash);
    // const returnTXs = [];
    // transactions.forEach(transaction => {
    //   const customTX = transactionsDAL.toJSON(transaction);
    //   customTX['assets'] = getTransactionAssets(customTX);
    //   delete customTX.Inputs;
    //   delete customTX.Outputs;
    //   returnTXs.push(customTX);
    // });

    const outputs = await outputsDAL.findAllByAddress(req.params.hash);
    const inputs = await inputsDAL.findAllByAddress(req.params.hash);
    if (outputs.length) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, {inputs, outputs}));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
