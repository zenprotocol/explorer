'use strict';

const deepMerge = require('deepmerge');
const dal = require('../../../lib/dal');
const wrapORMErrors = require('../../../lib/wrapORMErrors');

const blocksDAL = dal.createDAL('Block');

blocksDAL.findAllWithCoinbase = function(options = {}) {
  options.include = [
    {
      model: this.db.Transaction,
      where: {
        index: 0,
      },
      include: [
        {
          model: this.db.Output,
          where: {
            index: 0,
          },
        },
      ],
    },
  ];
  return this.findAll(options).then(blocks => blocks.map(block => {
    const customBlock = this.toJSON(block);
    delete customBlock.Transactions;
    const coinbaseOutput = (block.Transactions[0] || {}).Outputs[0] || {};
    customBlock.coinbaseAmount = coinbaseOutput.amount;
    return customBlock;
  }));
};

blocksDAL.findLatest = function({ transaction } = {}) {
  const options = {
    order: [['blockNumber', 'DESC']],
    limit: 1,
  };
  if (transaction) {
    options.transaction = transaction;
  }
  return this.findAll(options).then(results => (results.length ? results[0] : null));
};

blocksDAL.findByBlockNumber = function(blockNumber, { transaction } = {}) {
  if (
    isNaN(Number(blockNumber)) ||
    !Number.isInteger(Number(blockNumber)) ||
    Number(blockNumber) < 1 ||
    Number(blockNumber) >= 2147483647 // above db integer
  ) {
    return Promise.resolve(null);
  }
  const options = {
    where: {
      blockNumber,
    },
  };
  if (transaction) {
    options.transaction = transaction;
  }
  return this.findOne(options);
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
      order: [['blockNumber', 'DESC']],
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
