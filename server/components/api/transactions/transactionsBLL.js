'use strict';

const transactionsDAL = require('./transactionsDAL');
const zpTransactionsDAL = require('../zpTransactions/zpTransactionsDAL');
const createQueryObject = require('../../../lib/createQueryObject');
const getTransactionAssets = require('./getTransactionAssets');
const isCoinbaseTX = require('./isCoinbaseTX');

module.exports = {
  findAll: async function({
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
      findPromise = transactionsDAL.findAllByBlockNumber(Number(blockNumber), query);
      countPromise = transactionsDAL.countByBlockNumber(Number(blockNumber));
    } else if (address) {
      findPromise = transactionsDAL.findAllByAddress(address, {
        limit: query.limit,
        offset: query.offset,
        ascending,
      });
      countPromise = transactionsDAL.countByAddress(address);
    } else if (asset) {
      if (asset === '00') {
        findPromise = zpTransactionsDAL.findAll({ limit: query.limit, offset: query.offset });
        countPromise = zpTransactionsDAL.count();
      } else {
        findPromise = transactionsDAL.findAllByAsset(asset, {
          limit: query.limit,
          offset: query.offset,
          ascending,
        });
        countPromise = transactionsDAL.countByAsset(asset);
      }
    } else {
      findPromise = transactionsDAL.findAll(query);
      countPromise = transactionsDAL.count();
    }

    return await Promise.all([countPromise, findPromise]).then(
      transactionsDAL.getItemsAndCountResult
    );
  },
  findOne: async function({ hash } = {}) {
    const transaction = await transactionsDAL.findByHash(hash);
    if (transaction) {
      const customTX = transactionsDAL.toJSON(transaction);
      customTX.isCoinbase = isCoinbaseTX(transaction);
      const insOuts = await transactionsDAL.findAllTransactionAssetsInputsOutputs(transaction.id);
      customTX.Inputs = insOuts.Inputs;
      customTX.Outputs = insOuts.Outputs;
      customTX['assets'] = getTransactionAssets(customTX);
      delete customTX.Inputs;
      delete customTX.Outputs;
      return customTX;
    }
    return null;
  },
};
