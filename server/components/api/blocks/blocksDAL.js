'use strict';

const dal = require('../../../lib/dal');

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

module.exports = blocksDAL;
