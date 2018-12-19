'use strict';

const deepMerge = require('deepmerge');
const tags = require('common-tags');
const dal = require('../../../lib/dal');
const wrapORMErrors = require('../../../lib/wrapORMErrors');

const blocksDAL = dal.createDAL('Block');
const sequelize = blocksDAL.db.sequelize;

blocksDAL.findAllWithCoinbase = function({ limit = 10, offset = 0 } = {}) {
  const sql = tags.oneLine`
  WITH "BlocksLimited" AS 
      (SELECT "Blocks".*
      FROM "Blocks"
      ORDER BY  "Blocks"."blockNumber" DESC LIMIT :limit OFFSET :offset)
  SELECT "BlocksLimited".*,
          "Outputs"."amount" AS "coinbaseAmount"
  FROM "BlocksLimited"
  JOIN 
      (SELECT id,
          "BlockId"
      FROM "Transactions"
      WHERE "Transactions"."BlockId" IN 
          (SELECT id
          FROM "BlocksLimited")
                  AND "Transactions"."index" = 0 ) AS "CoinbaseTx"
          ON "CoinbaseTx"."BlockId" = "BlocksLimited".id
  JOIN "Outputs"
      ON "Outputs"."TransactionId" = "CoinbaseTx"."id"
          AND "Outputs"."index" = 0
  `;
  return sequelize
    .query(sql, {
      replacements: {
        limit,
        offset,
      },
      type: sequelize.QueryTypes.SELECT,
    });
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
