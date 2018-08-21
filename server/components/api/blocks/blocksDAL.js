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

blocksDAL.search = function(search) {
  const blockNumber = Number(search);
  if (isNaN(blockNumber)) {
    return Promise.resolve([]);
  }
  return this.findAll({
    where: {
      blockNumber,
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
