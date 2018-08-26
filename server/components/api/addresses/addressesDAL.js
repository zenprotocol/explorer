'use strict';

const outputsDAL = require('../outputs/outputsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const addressesDAL = {};

addressesDAL.findOne = function(address) {
  return outputsDAL.findAll({
    where: {
      address,
    },
    limit: 1,
  }).then((results) => {
    return results.length ? results[0] : null;
  });
};

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
      ("outputSum" - "inputSum") AS "balance",
      "BothSums"."address" AS "address"
    FROM
      (SELECT
        coalesce("OutputSums"."address", "InputSums"."address") AS "address",
        "OutputSums"."outputSum",
        CASE
      WHEN "InputSums"."inputSum" IS NULL
      THEN 0
      ELSE "InputSums"."inputSum"
      END
      FROM
        (SELECT
          "Output"."address",
          sum("Output"."amount") AS "outputSum"
        FROM "Outputs" AS "Output"
        WHERE "Output"."asset" = '00' AND "Output"."address" LIKE :search
        GROUP BY "address") AS "OutputSums"
        FULL OUTER JOIN
        (SELECT
          "Output"."address",
          sum("Output"."amount") AS "inputSum"
        FROM
          "Outputs" AS "Output"
          INNER JOIN "Inputs" AS "Input"
          ON "Input"."OutputId" = "Output"."id"
        WHERE "Output"."asset" = '00' AND "Output"."address" LIKE :search
        GROUP BY "Output"."address") AS "InputSums"
        ON "OutputSums"."address" = "InputSums"."address") AS "BothSums"
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
    outputsDAL.findAll({
      where,
      attributes: ['address'],
      group: 'address',
      limit,
    })
    // sequelize.query(sql, {
    //   replacements: {
    //     search: `%${search}%`,
    //     limit,
    //   },
    //   type: sequelize.QueryTypes.SELECT,
    // })
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
