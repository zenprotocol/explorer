'use strict';

const deepMerge = require('deepmerge');
const dal = require('../../../lib/dal');
const wrapORMErrors = require('../../../lib/wrapORMErrors');

const blocksDAL = dal.createDAL('Block');

blocksDAL.findLatest = function(amount = 1) {
  return this.findAll({
    order: [['createdAt', 'DESC']],
    limit: amount,
  });
};
blocksDAL.findLatest = blocksDAL.findLatest.bind(blocksDAL);

blocksDAL.findByBlockNumber = function(blockNumber) {
  return this.findOne({
    where: {
      blockNumber,
    },
  });
};

blocksDAL.findByHash = function(hash) {
  return this.findOne({
    where: {
      hash,
    },
  });
};

blocksDAL.addTransaction = async function(block, transaction, options = {}) {
  return block.addTransaction(transaction, options);
};

blocksDAL.updateByBlockNumber = async function(blockNumber, values = {}, options = {}) {
  return new Promise((resolve, reject) => {
    this.db[this.model]
      .findOne({ where: { blockNumber } })
      .then(model => {
        return model.update(values, deepMerge({ individualHooks: true }, options));
      })
      .then(resolve)
      .catch(error => {
        reject(wrapORMErrors(error));
      });
  });
};

module.exports = blocksDAL;
