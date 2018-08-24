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

addressesDAL.search = function(search, limit = 10) {
  const sequelize = outputsDAL.db.sequelize;
  const where = {
    address: {
      [sequelize.Op.like]: `%${search}%`,
    },
  };
  const sql = `
  SELECT "Addresses"."address", "Addresses"."txCount", "Balance"."balance"
  FROM
    (SELECT "OutputInput"."address", MAX("OutputInput"."TransactionId") AS "TransactionId", COUNT(DISTINCT "OutputInput"."TransactionId") AS "txCount"
    FROM
      (            SELECT "address", "createdAt", "TransactionId"
        FROM "Outputs" AS "Output"
        WHERE "Output"."address" LIKE :search

      UNION

        SELECT "Output"."address", "Input"."createdAt", "Input"."TransactionId"
        FROM "Outputs" AS "Output"
          INNER JOIN "Inputs" AS "Input"
          ON "Input"."OutputId" = "Output"."id"
        WHERE "Output"."address" LIKE :search) AS "OutputInput"

    GROUP BY "OutputInput"."address") AS "Addresses"
    INNER JOIN
    (SELECT
      ("output_sum" - "input_sum") AS "balance",
      "bothsums"."address" AS "address"
    FROM
      (SELECT
        coalesce("osums"."address", "isums"."address") AS "address",
        "osums"."output_sum",
        CASE
      WHEN "isums"."input_sum" IS NULL
      THEN 0
      ELSE "isums"."input_sum"
      END
      FROM
        (SELECT
          "o"."address",
          sum("o"."amount") AS "output_sum"
        FROM "Outputs" AS "o"
        WHERE "o"."asset" = '00'
        GROUP BY "address") AS "osums"
        full outer join
        (SELECT
          "io"."address",
          sum("io"."amount") AS "input_sum"
        FROM
          "Outputs" AS "io"
          inner join "Inputs" AS "i"
          ON "i"."OutputId" = "io"."id"
        WHERE "io"."asset" = '00'
        GROUP BY "io"."address") AS "isums"
        ON "osums"."address" = "isums"."address") AS "bothsums"
    ) AS "Balance"
    ON "Balance"."address" = "Addresses"."address"
  ORDER BY "TransactionId" DESC
  LIMIT :limit
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
        limit,
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
