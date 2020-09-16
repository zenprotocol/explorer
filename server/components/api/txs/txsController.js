'use strict';

const httpStatus = require('http-status');
const zen = require('@zen/zenjs');
const outputsDAL = require('../outputs/outputsDAL');
const jsonResponse = require('../../../lib/jsonResponse');
const HttpError = require('../../../lib/HttpError');
const getTxAssets = require('./getTxAssets');
const Service = require('../../../lib/Service');
const BlockchainParser = require('../../../lib/BlockchainParser');
const txsBLL = require('./txsBLL');

module.exports = {
  index: async function (req, res) {
    const itemsAndCount = await txsBLL.findAll({
      address: req.query.address,
      contractAddress: req.query.contractAddress,
      asset: req.query.asset,
      hashOrBlockNumber: req.query.hashOrBlockNumber,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, itemsAndCount));
  },
  show: async function (req, res) {
    const transaction = await txsBLL.findOne({ hash: req.params.hash });
    if (transaction) {
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, transaction));
    } else {
      throw new HttpError(httpStatus.NOT_FOUND);
    }
  },
  /**
   * Get a list of assets, for each asset a list of inputs and outputs
   */
  assets: async function (req, res) {
    const assets = await txsBLL.findAssets({
      hash: req.params.hash,
      address: req.query.address,
      asset: req.query.asset,
    });

    res.status(httpStatus.OK).json(
      jsonResponse.create(httpStatus.OK, {
        count: assets.length,
        items: assets,
      })
    );
  },
  broadcast: async function (req, res) {
    const tx = req.body.tx || '';
    if (!tx) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    const response = await Service.wallet.broadcastTx(tx);
    res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, response));
  },
  getFromRaw: async function (req, res) {
    const hex = req.body.hex;
    if (!hex) {
      throw new HttpError(httpStatus.BAD_REQUEST);
    }

    try {
      const tx = zen.Transaction.fromHex(hex);
      const blockchainParser = new BlockchainParser();
      const txCustom = {
        inputs: [],
        outputs: [],
      };

      txCustom.outputs = tx.outputs.map((output, index) => {
        const { lockType, lockValue, address } = blockchainParser.getLockValuesFromOutput(output);
        const asset = output.spend.asset.asset;
        const amount = output.spend.amount['0'];
        return {
          id: index + 1, // fake id needed in UI
          lockType,
          address,
          lockValue,
          asset,
          amount,
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
          throw new HttpError(
            httpStatus.BAD_REQUEST,
            'One of the inputs is not yet in the blockchain'
          );
        }

        txCustom.inputs.push({
          id: i + 1, // fake id
          lockType: output.lockType,
          address: output.address,
          asset: output.asset,
          amount: output.amount,
        });
      }

      const assets = getTxAssets(txCustom);
      res.status(httpStatus.OK).json(jsonResponse.create(httpStatus.OK, assets));
    } catch (error) {
      throw new HttpError(error.status || httpStatus.INTERNAL_SERVER_ERROR, error.customMessage);
    }
  },
};
