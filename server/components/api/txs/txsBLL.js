'use strict';

const txsDAL = require('./txsDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const getTxAssets = require('./getTxAssets');
const isCoinbaseTX = require('./isCoinbaseTx');

module.exports = {
  /**
   * find all txs by blockNumber, address or asset
   */
  findAll: async function ({ hashOrBlockNumber, address, asset, page = 0, pageSize = 10 } = {}) {
    const query = createQueryObject({ page, pageSize });

    let countPromise;
    let findPromise;
    if (hashOrBlockNumber) {
      findPromise = txsDAL.findAllByBlock(Object.assign({}, query, { hashOrBlockNumber }));
      countPromise = txsDAL.countByBlock({ hashOrBlockNumber });
    } else if (address) {
      findPromise = txsDAL.findAllByAddress({
        address,
        limit: query.limit,
        offset: query.offset,
      });
      countPromise = txsDAL.countByAddress({ address });
    } else if (asset) {
      findPromise = txsDAL.findAllByAsset({
        asset,
        limit: query.limit,
        offset: query.offset,
      });
      countPromise = txsDAL.countByAsset({ asset });
    } else {
      findPromise = txsDAL.findAll(query);
      countPromise = txsDAL.count();
    }

    return await Promise.all([countPromise, findPromise]).then(txsDAL.getItemsAndCountResult);
  },
  findOne: async function ({ hash } = {}) {
    const tx = await txsDAL.findByHash(hash);
    if (tx) {
      const customTX = txsDAL.toJSON(tx);
      customTX.isCoinbase = isCoinbaseTX(tx);
      const insOuts = await txsDAL.findAllTxInputsOutputsAggregated({ txId: tx.id });
      customTX.inputs = insOuts.inputs;
      customTX.outputs = insOuts.outputs;
      customTX['assets'] = getTxAssets(customTX);
      delete customTX.inputs;
      delete customTX.outputs;
      return customTX;
    }
    return null;
  },
  /**
   * Get a list of assets, for each asset a list of inputs and outputs
   * 
   * @param {Object} params
   * @param {string} params.hash - the tx hash
   * @param {string} params.address - an address to change the results for
   * @param {string} params.asset - return only results for this asset
   */
  findAssets: async function ({ hash, address, asset } = {}) {
    const tx = await txsDAL.findOne({ where: { hash } });
    if (!tx) return null;

    const insOuts = await txsDAL.findAllTxInputsOutputsAggregated({ txId: tx.id, asset });
    return getTxAssets(insOuts, address);
  },
};
