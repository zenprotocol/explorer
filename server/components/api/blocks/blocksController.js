'use strict';

const httpStatus = require('http-status');
const blocksDAL = require('./blocksDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');

function sortTransactionInsAndOutsByAssets (transaction) {
  const assets = {};
  if(transaction.Outputs && transaction.Outputs.length) {
    transaction.Outputs.forEach((output) => {
      if(!assets[output.asset]) {
        assets[output.asset] = {
          inputs: [],
          outputs: [],
        };
      }

      assets[output.asset].outputs.push(output);
    });
  }

  if(transaction.Inputs && transaction.Inputs.length) {
    transaction.Inputs.forEach((input) => {
      if (input.Output) {
        if(!assets[input.Output.asset]) {
          assets[input.Output.asset] = {
            inputs: [],
            outputs: [],
          };
        }
        assets[input.Output.asset].inputs.push(input);
      }
    });
  }

  return Object.keys(assets).map((asset) => {
    return {
      asset: asset,
      inputs: assets[asset].inputs,
      outputs: assets[asset].outputs,
    };
  }).sort((a, b) => b.asset < a.asset);
}

module.exports = {
  index: async function(req, res) {
    const page = req.query.page || 0;
    const pageSize = req.query.pageSize;
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'blockNumber', desc: true }];

    const query = createQueryObject({page, pageSize, sorted});
    const [count, allBlocks] = await Promise.all([blocksDAL.count(), blocksDAL.findAllCountTransactions(query)]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allBlocks,
        total: count,
      })
    );
  },
  findByBlockNumber: async function(req, res) {
    const block = await blocksDAL.findByBlockNumber(req.params.id);
    const customBlock = block.toJSON();
    console.log(customBlock);
    customBlock.Transactions.forEach((transaction) => {
      // make sure the order is right
      transaction.Outputs.sort((a, b) => {
        return Number(b.index) < Number(a.index);
      });
      transaction.Inputs.sort((a, b) => {
        return Number(b.index) < Number(a.index);
      });

      transaction['assets'] = sortTransactionInsAndOutsByAssets(transaction);
      delete transaction.Inputs;
      delete transaction.Outputs;
    });
    if (customBlock) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, customBlock));
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
