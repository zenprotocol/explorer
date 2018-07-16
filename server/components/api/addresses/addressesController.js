'use strict';

const httpStatus = require('http-status');
const transactionsDAL = require('../transactions/transactionsDAL');
const outputsDAL = require('../outputs/outputsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');

module.exports = {
  index: async function(req, res) {
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'createdAt', desc: true }];

    const query = createQueryObject({ sorted });
    const [count, allItems] = await Promise.all([transactionsDAL.count(), transactionsDAL.findAll(query)]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        items: allItems,
        total: count,
      })
    );
  },
  show: async function(req, res) {
    const asset = req.params.asset || '00';
    // const [outputs, inputs] = await Promise.all([
    //   await outputsDAL.findAllByAddress(req.params.address, asset),
    //   await inputsDAL.findAllByAddress(req.params.address, asset),
    // ]);

    // // inputs
    // const inputTransactionIds = [];
    // // reduce to have unique transactions
    // const inputTXs = inputs.reduce((all, input) => {
    //   if(!inputTransactionIds.includes(input.Transaction.id)) {
    //     inputTransactionIds.push(input.Transaction.id);
    //     all.push({
    //       type: 'input',
    //       hash: input.Transaction.hash,
    //       timestamp: input.Transaction.Block.timestamp,
    //       inputs: [
    //         {
    //           id: input.id,
    //           address: input.Output.address,
    //           amount: input.Output.amount,
    //         },
    //       ],
    //       outputs: input.Transaction.Outputs.map(output => {
    //         return {
    //           id: output.id,
    //           asset: output.asset,
    //           address: output.address,
    //           amount: output.amount,
    //           lockType: output.lockType,
    //         };
    //       }),
    //     });
    //   }

    //   return all;
    // }, []);
    // // outputs
    // const outputTXs = outputs.map(output => {
    //   return {
    //     type: 'output',
    //     hash: output.Transaction.hash,
    //     timestamp: output.Transaction.Block.timestamp,
    //     inputs: output.Transaction.Inputs.map(input => {
    //       return {
    //         id: input.id,
    //         address: input.Output.address,
    //         amount: input.Output.amount,
    //       };
    //     }),
    //     outputs: [
    //       {
    //         id: output.id,
    //         asset: output.asset,
    //         address: output.address,
    //         amount: output.amount,
    //         lockType: output.lockType,
    //       },
    //     ],
    //   };
    // });
    // // combine
    // const combinedTXs = inputTXs.concat(outputTXs);
    // combinedTXs.sort((a, b) => {
    //   return Number(b.timestamp) > Number(a.timestamp);
    // });

    // const totalReceived = outputs.reduce((prev, cur) => {
    //   return prev + Number(cur.amount);
    // }, 0);
    // const totalSent = inputs.reduce((prev, cur) => {
    //   return prev + Number(cur.amount);
    // }, 0);

    // const balance = totalReceived - totalSent;

    const transactions = await transactionsDAL.findAllByAddress(req.params.address, asset);
    console.log(transactions);
    if (transactions.length) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, {
        // totalReceived,
        // totalSent,
        // balance,
        // transactions: combinedTXs,
        transactions
      }));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  findAllAssets: async function(req, res) {
    const assets = await outputsDAL.findAllAddressAssets(req.params.address);

    if (assets.length) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, assets));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
};
