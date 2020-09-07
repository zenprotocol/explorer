'use strict';

const deepMerge = require('deepmerge');
const tags = require('common-tags');
const dal = require('../../../lib/dal');
const wrapORMErrors = require('../../../lib/wrapORMErrors');

const blocksDAL = dal.createDAL('Block');
const sequelize = blocksDAL.db.sequelize;

blocksDAL.findAllWithCoinbase = function ({ limit = 10, offset = 0 } = {}) {
  /**
   * Limit the amount of blocks processed for speed optimization
   * Calculate the coinbase by summing up all the coinbase lock outputs
   * Calculate the allocation by summing up all the contract lock outputs
   * Special care for genesis block
   */
  const sql = tags.oneLine`
  WITH "BlocksLimited" AS 
      (SELECT "Blocks".*
      FROM "Blocks"
      ORDER BY "Blocks"."blockNumber" DESC LIMIT :limit OFFSET :offset)
  
  SELECT "BlocksLimited".*,
    CASE
      WHEN "BlocksLimited"."blockNumber" = 1 THEN 0
      ELSE COALESCE("CoinbaseOutputSum"."amount", 0)
    END AS "coinbaseAmount",
    CASE
      WHEN "BlocksLimited"."blockNumber" = 1 THEN 0
      ELSE COALESCE("ContractLockOutputSum"."amount", 0)
    END AS "allocationAmount"
  FROM "BlocksLimited"
  JOIN 
    (SELECT id,
      "blockNumber"
    FROM "Txs"
    WHERE "Txs"."blockNumber" IN 
      (SELECT "blockNumber"
      FROM "BlocksLimited")
              AND "Txs"."index" = 0 ) AS "CoinbaseTx"
      ON "CoinbaseTx"."blockNumber" = "BlocksLimited"."blockNumber"
  LEFT JOIN (
    SELECT sum(amount) as amount, "txId"
    FROM "Outputs"
    WHERE "Outputs"."lockType" = 'Coinbase'
    AND "Outputs"."blockNumber" IN 
      (SELECT "blockNumber"
      FROM "BlocksLimited")
    GROUP BY "txId") AS "CoinbaseOutputSum"
  ON "CoinbaseOutputSum"."txId" = "CoinbaseTx"."id"

  LEFT JOIN (
    SELECT sum(amount) as amount, "txId"
    FROM "Outputs"
    WHERE "Outputs"."lockType" = 'Contract'
    AND "Outputs"."blockNumber" IN 
      (SELECT "blockNumber"
      FROM "BlocksLimited")
    GROUP BY "txId") AS "ContractLockOutputSum"
  ON "ContractLockOutputSum"."txId" = "CoinbaseTx"."id"

  ORDER BY "BlocksLimited"."blockNumber" DESC
  `;
  return sequelize.query(sql, {
    replacements: {
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

blocksDAL.findLatest = function ({ transaction } = {}) {
  const options = {
    order: [['blockNumber', 'DESC']],
    limit: 1,
  };
  if (transaction) {
    options.transaction = transaction;
  }
  return this.findAll(options).then((results) => (results.length ? results[0] : null));
};

blocksDAL.findByHash = function (hash) {
  return this.findOne({
    where: {
      hash,
    },
  });
};

blocksDAL.search = function (search, limit = 10) {
  const Op = this.db.Sequelize.Op;
  const whereByHash = {
    hash: {
      [Op.like]: `%${search}%`,
    },
  };

  const byBlockNumberPromise =
    isNaN(Number(search)) ||
    !Number.isInteger(Number(search)) ||
    Number(search) < 1 ||
    Number(search) >= 2147483647
      ? Promise.resolve(null)
      : this.findById(search);

  return Promise.all([
    this.count({ where: whereByHash }),
    this.findAll({
      where: whereByHash,
      limit,
      order: [['blockNumber', 'DESC']],
    }),
    byBlockNumberPromise,
  ]).then((results) => {
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

blocksDAL.addTransaction = async function (block, transaction, options = {}) {
  return block.addTransaction(transaction, options);
};

blocksDAL.updateByBlockNumber = async function (blockNumber, values = {}, options = {}) {
  return new Promise((resolve, reject) => {
    this.db[this.model]
      .findOne({ where: { blockNumber } })
      .then((model) => {
        return model.update(values, deepMerge({ individualHooks: true }, options));
      })
      .then(resolve)
      .catch((error) => {
        reject(wrapORMErrors(error));
      });
  });
};

module.exports = blocksDAL;
