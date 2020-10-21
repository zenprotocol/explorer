'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');

const sequelize = db.sequelize;

const blocksDAL = dal.createDAL('Block');

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
blocksDAL.findFirst = function ({ transaction } = {}) {
  return this.findOne({
    order: [['blockNumber', 'ASC']],
    transaction,
  });
};

blocksDAL.findByHash = function (hash) {
  return this.findOne({
    where: {
      hash,
    },
  });
};

/**
 * Find all blocks with timestamp on the given date
 * @param {Object} params
 * @param {string} params.dateString - the date in a sql friendly format (2020-09-17)
 */
blocksDAL.findByDay = function ({ dateString, transaction } = {}) {
  const sql = tags.oneLine`
  SELECT *
  FROM "Blocks"
  WHERE to_timestamp("Blocks"."timestamp" / 1000)::date = :dateString::date 
    AND to_timestamp("Blocks"."timestamp" / 1000)::date < :dateString::date + '1 day'::interval;
  `;

  return sequelize.query(sql, {
    replacements: {
      dateString,
    },
    type: sequelize.QueryTypes.SELECT,
    transaction,
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

/**
 * Find the average difficulty for a day
 * @param {Object} params
 * @param {string} params.dateString - the date in a sql friendly format (2020-09-17)
 */
blocksDAL.findDifficultyForDay = function ({ dateString, transaction } = {}) {
  const sql = tags.oneLine`
  with t_vals as
  (select "timestamp" as tsp, "blockNumber" as block_number, least (greatest ((difficulty >> 24), 3), 32) as lnth, (difficulty & x'00FFFFFF' :: int) as mantissa from "Blocks")
  , i_vals as
  (select date_trunc('day',to_timestamp(0) + tsp * interval '1 millisecond') as block_date, ((x'1000000' :: int) :: real / (mantissa :: real)) * 256 ^ (32 - lnth) as expected_hashes, block_number from t_vals)

  select (sum(expected_hashes) / 86400.0) * 55000 / 1000000000000 as "difficulty" from i_vals
  where block_date = :dateString::date;
  `;

  return sequelize.query(sql, {
    replacements: {
      dateString,
    },
    type: sequelize.QueryTypes.SELECT,
    transaction,
  });
};

module.exports = blocksDAL;
