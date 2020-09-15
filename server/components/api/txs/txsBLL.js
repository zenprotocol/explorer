'use strict';

const txsDAL = require('./txsDAL');
const assetTxsDAL = require('../asset-txs/assetTxsDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const getTxAssets = require('./getTxAssets');
const isCoinbaseTX = require('./isCoinbaseTx');

module.exports = {
  findAll: async function ({
    blockNumber,
    address,
    asset,
    page = 0,
    pageSize = 10,
    order,
    sorted,
  } = {}) {
    // find by blockNumber, address or asset
    const ascending = order === 'asc'; // descending by default
    const sortBy =
      sorted && sorted != '[]' ? JSON.parse(sorted) : [{ id: 'createdAt', desc: !ascending }];

    const query = createQueryObject({ page, pageSize, sorted: sortBy });

    let countPromise;
    let findPromise;
    if (blockNumber && !isNaN(blockNumber)) {
      findPromise = txsDAL.findAllByBlockNumber(Number(blockNumber), query);
      countPromise = txsDAL.countByBlockNumber(Number(blockNumber));
    } else if (address) {
      findPromise = txsDAL.findAllByAddress(address, {
        limit: query.limit,
        offset: query.offset,
        ascending,
      });
      countPromise = txsDAL.countByAddress(address);
    } else if (asset) {
      findPromise = assetTxsDAL.findAllByAssetWithRelations({
        asset,
        limit: query.limit,
        offset: query.offset,
      });
      countPromise = assetTxsDAL.count({ where: { asset } });
    } else {
      findPromise = txsDAL.findAll(query);
      countPromise = txsDAL.count();
    }

    return await Promise.all([countPromise, findPromise]).then(
      txsDAL.getItemsAndCountResult
    );
  },
  findOne: async function ({ hash } = {}) {
    const transaction = await txsDAL.findByHash(hash);
    if (transaction) {
      const customTX = txsDAL.toJSON(transaction);
      customTX.isCoinbaseTx = isCoinbaseTX(transaction);
      const insOuts = await txsDAL.findAllTransactionAssetsInputsOutputs(transaction.id);
      customTX.Inputs = insOuts.Inputs;
      customTX.Outputs = insOuts.Outputs;
      customTX['assets'] = getTxAssets(customTX);
      delete customTX.Inputs;
      delete customTX.Outputs;
      return customTX;
    }
    return null;
  },
};
