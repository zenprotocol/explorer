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
    attributes: {
      include: [
        [
          this.db.Sequelize.literal(
            '(SELECT "Blocks"."blockNumber" FROM "Blocks" WHERE "Blocks"."hash" = "Block"."parent" LIMIT 1)'
          ),
          'parentBlockNumber',
        ],
      ],
    },
  });
};

blocksDAL.findByHash = function(hash) {
  return this.findOne({
    where: {
      hash,
    },
    attributes: {
      include: [
        [
          this.db.Sequelize.literal(
            '(SELECT "Blocks"."blockNumber" FROM "Blocks" WHERE "Blocks"."hash" = "Block"."parent" LIMIT 1)'
          ),
          'parentBlockNumber',
        ],
      ],
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
