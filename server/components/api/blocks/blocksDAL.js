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
  if (isNaN(Number(blockNumber))) {
    return Promise.resolve(null);
  }
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

blocksDAL.search = function(search, limit = 10) {
  const Op = this.db.sequelize.Op;
  const whereByHash = {
    hash: {
      [Op.like]: `%${search}%`,
    },
  };

  return Promise.all([
    this.count({ where: whereByHash }),
    this.findAll({
      where: whereByHash,
      limit,
      order: [['createdAt', 'DESC']],
    }),
    this.findByBlockNumber(search),
  ]).then(results => {
    let count = Number(results[0]);
    let items = results[1];
    if (results[2]) {
      count += 1;
      items = [results[2]].concat(results[1]);
    }
    if (items.length > limit) {
      items = items.slice(0, limit);
    }
    return [count, items];
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
