'use strict';

const httpStatus = require('http-status');
const zen = require('@zen/zenjs');
const transactionsDAL = require('./transactionsDAL');
const outputsDAL = require('../outputs/outputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const createQueryObject = require('../../../lib/createQueryObject');
const getTransactionAssets = require('./getTransactionAssets');
const Service = require('../../../lib/Service');
const BlockchainParser = require('../../../lib/BlockchainParser');
const isHash = require('../../../lib/isHash');
const transactionsBLL = require('./transactionsBLL');

module.exports = {
  index: async function(req, res) {
    const itemsAndCount = await transactionsBLL.findAll({
      address: req.query.address,
      asset: req.query.asset,
      blockNumber: req.query.blockNumber,
      order: req.query.order,
      page: req.query.page,
      pageSize: req.query.pageSize,
      sorted: req.query.sorted,
    });
    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, itemsAndCount)
    );
  },
  show: async function(req, res) {
    const transaction = await transactionsBLL.findOne({hash: req.params.hash});
    if (transaction) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, transaction));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  assets: async function(req, res) {
    // find by blockNumber or address
    const { hashOrBlockNumber, txHash, address } = req.params;
    const page = req.query.page || 0;
    const pageSize = req.query.pageSize || 10;
    const firstTransactionId = req.query.firstTransactionId || 0;
    const ascending = req.query.order === 'asc'; // descending by default
    const sorted =
      req.query.sorted && req.query.sorted != '[]'
        ? JSON.parse(req.query.sorted)
        : [{ id: 'createdAt', desc: !ascending }];

    const query = createQueryObject({ page, pageSize, sorted });
    
    let countPromise, 
      findPromise;
    if (hashOrBlockNumber) {
      if(!isHash(hashOrBlockNumber) && (isNaN(hashOrBlockNumber) || Number(hashOrBlockNumber) > 2147483647)) {
        throw new HttpError(httpStatus.BAD_REQUEST);
      }
      findPromise = transactionsDAL.findAllAssetsByBlock(hashOrBlockNumber, query);
      countPromise = transactionsDAL.countAssetsByBlock(hashOrBlockNumber);
    }
    else if (txHash) {
      findPromise = transactionsDAL.findAllAssetsByTxHash(txHash, query);
      countPromise = transactionsDAL.countAssetsByTxHash(txHash);
    }
    else if (address) {
      findPromise = transactionsDAL.findAllAssetsByAddress(address, query);
      countPromise = transactionsDAL.countAssetsByAddress(address, firstTransactionId, ascending);
    }
    else {
      // TODO - find all transaction assets !!!
      findPromise = transactionsDAL.findAll(query);
      countPromise = transactionsDAL.count();
    }

    const [count, transactionAssets] = await Promise.all([countPromise, findPromise]);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        total: count,
        items: transactionAssets,
      })
    );
  },
  asset: async function(req, res) {
    // get a specific asset from a tx. /tx/:hash/:assetName 
    const { id, asset } = req.params;

    if(!id || !asset) {
      throw new HttpError(httpStatus.NOT_FOUND);
    }

    const transactionAsset = await transactionsDAL.findTransactionAssetInputsOutputs(id, asset);

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, transactionAsset)
    );
  },
  getById: async function(req, res) {
    const transaction = await transactionsDAL.findById(req.params.id);
    if (transaction) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, transaction));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  broadcast: async function(req, res) {
    const tx = req.body.tx || '';
    if (!tx) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }
    
    const response = await Service.wallet.broadcastTx(tx);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, response));
  },
  getFromRaw: async function(req, res) {
    const hex = req.body.hex;
    if (!hex) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    try {
      const tx = zen.Transaction.fromHex(hex);
      const blockchainParser = new BlockchainParser();
      const txCustom = {
        Inputs: [],
        Outputs: [],
      };

      txCustom.Outputs = tx.outputs.map((output, index) => {
        const { lockType, lockValue, address } = blockchainParser.getLockValuesFromOutput(output);
        const asset = output.spend.asset.asset;
        const amount = output.spend.amount['0'];
        return {
          id: index + 1, // fake id
          lockType,
          address,
          lockValue,
          asset,
          amount
        };
      });

      for (let i = 0; i < tx.inputs.length; i++) {
        const input = tx.inputs[i];
        const outpoint = {
          txHash: input.input.txHash.hash,
          index: input.input.index,
        };
        // search for this tx and index
        const output = await outputsDAL.findOutpoint(outpoint.txHash, outpoint.index);

        if (!output) {
          throw new HttpError(httpStatus.BAD_REQUEST, 'One of the inputs is not yet in the blockchain');
        }

        txCustom.Inputs.push({
          id: i + 1, // fake id
          Output: output,
        });
      }

      const assets = getTransactionAssets(txCustom);
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, assets));
    } catch (error) {
      throw new HttpError(error.status || httpStatus.INTERNAL_SERVER_ERROR, error.customMessage);
    }
  },
  create: async function(req, res) {
    const transaction = await transactionsDAL.create(req.body);
    res.status(httpStatus.CREATED).json(jsonResponse.create(httpStatus.CREATED, transaction));
  },
  update: async function(req, res) {
    const transaction = await transactionsDAL.update(req.params.id, req.body);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, transaction));
  },
  delete: async function(req, res) {
    await transactionsDAL.delete(req.params.id);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK));
  },
};
