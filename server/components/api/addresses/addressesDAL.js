'use strict';

const outputsDAL = require('../outputs/outputsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const addressesDAL = {};

addressesDAL.addressExists = function(address) {
  return outputsDAL.findAll({
    where: {
      address,
    },
    limit: 1,
  }).then((results) => {
    return results.length > 0;
  });
};

addressesDAL.search = function(search) {
  const sequelize = outputsDAL.db.sequelize;
  const where = {
    address: {
      [sequelize.Op.like]: `%${search}%`,
    },
  };
  const sql = `
  SELECT "address"
  FROM
    (SELECT "address", MAX("createdAt") AS "createdAt"
    FROM "Outputs" AS "Output"
    WHERE "Output"."address" LIKE :search
    GROUP BY "address") AS "Output"
  ORDER BY "createdAt" DESC LIMIT 10
  `;
  return Promise.all([
    outputsDAL.count({
      where,
      distinct: true,
      col: 'address',
    }),
    sequelize.query(sql, {
      replacements: {
        search: `%${search}%`,
      },
      type: sequelize.QueryTypes.SELECT,
    })
  ]);
};

addressesDAL.getSentSums = async function(address) {
  const db = inputsDAL.db;
  const Sequelize = db.Sequelize;
  return inputsDAL.findAll({
    attributes: ['Output.asset', [Sequelize.fn('sum', Sequelize.col('Output.amount')), 'total']],
    include: [
      {
        model: db.Output,
        where: {
          address,
        },
        attributes: [],
      },
    ],
    group: Sequelize.col('Output.asset'),
    raw: true,
  });
};
addressesDAL.getReceivedSums = async function(address) {
  const db = outputsDAL.db;
  const Sequelize = db.Sequelize;
  return outputsDAL.findAll({
    attributes: ['asset', [Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
    where: {
      address,
    },
    group: 'asset',
    raw: true,
  });
};

module.exports = addressesDAL;
