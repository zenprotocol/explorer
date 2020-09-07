'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const outputsDAL = require('../outputs/outputsDAL');
const infosDAL = require('../infos/infosDAL');
const db = require('../../../db/sequelize/models');
const AddressUtils = require('../../../../src/common/utils/AddressUtils');
const addressesDAL = dal.createDAL('Address');

const sequelize = db.sequelize;
const Op = db.Sequelize.Op;

const LOCK_TYPE_FOR_BALANCE = '"lockType" = ANY(\'{"Coinbase","PK","Contract","Destroy"}\')';

addressesDAL.findOne = function (address) {
  return outputsDAL
    .findAll({
      where: {
        address,
      },
      limit: 1,
    })
    .then((results) => {
      return results.length ? results[0] : null;
    });
};

addressesDAL.addressExists = function (address) {
  const sql = tags.oneLine`
    SELECT 1 FROM "Outputs" WHERE "Outputs"."address" = :address LIMIT 1;
  `;
  return sequelize
    .query(sql, {
      replacements: {
        address,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then((results) => {
      return results.length > 0;
    });
};

addressesDAL.search = async function (search, limit = 10) {
  const like = AddressUtils.isAddress(search) ? `${search}%` : `%${search}%`;
  const prefix = AddressUtils.getPrefix(((await infosDAL.findByName('chain')) || {}).value);
  const where = {
    address: {
      [Op.and]: {
        [Op.like]: like,
        [Op.notLike]: `c${prefix}%`,
      },
    },
  };
  return Promise.all([
    this.count({
      where,
      distinct: true,
      col: 'address',
    }),
    this.findAll({
      where,
      attributes: ['address'],
      group: 'address',
      limit,
    }),
  ]);
};

addressesDAL.getAssetAmounts = function (address) {
  return this.findAll({
    where: {
      address,
      balance: {
        [Op.gt]: 0,
      },
    },
    order: [['balance', 'DESC']],
  });
};

/**
 * Get the send and received amounts for an address taking change-back into account
 * divides the calculation per tx
 */
addressesDAL.getZpSentReceived = function (address) {
  const sql = tags.oneLine`
  SELECT
    sum(bothsums.sent) AS sent,
    sum(bothsums.received) AS received,
    sum(bothsums.received) - sum(bothsums.sent) AS balance
  FROM
    (SELECT
      CASE
        WHEN COALESCE(isums.input_sum, 0) = 0 THEN COALESCE(osums.output_sum, 0)
        ELSE 0
      END AS received,
      CASE
        WHEN COALESCE(isums.input_sum, 0) > 0 THEN isums.input_sum - COALESCE(osums.output_sum, 0)
        ELSE 0
      END AS sent
    FROM
      (SELECT
        o."txId",
        SUM(o.amount) AS output_sum
      FROM "Outputs" o
      WHERE o.address = :address
        AND o.asset = '00' AND o.${LOCK_TYPE_FOR_BALANCE}
      GROUP BY "txId") AS osums
      FULL OUTER JOIN
      (SELECT
        i."txId",
        SUM(io.amount) AS input_sum
      FROM
        "Outputs" io
        JOIN "Inputs" i
        ON i."outputId" = io.id
      WHERE io.address = :address
        AND io.asset = '00' AND io.${LOCK_TYPE_FOR_BALANCE}
      GROUP BY i."txId") AS isums
      ON osums."txId" = isums."txId") AS bothsums;
  `;

  return sequelize
    .query(sql, {
      replacements: {
        address,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then((results) => (results.length ? results[0] : null));
};

addressesDAL.getZpBalance = async function (address) {
  return this.findOne({
    where: {
      address,
      asset: '00',
    },
  });
};

/**
 * Get all addresses' balances up until blockNumber
 *
 * @param {number} blockNumber the block number
 */
addressesDAL.snapshotBalancesByBlock = async function (blockNumber) {
  const sql = tags.oneLine`
  SELECT
    bothsums.address AS address,
    (output_sum - input_sum) AS amount
  FROM
    (SELECT
      COALESCE(osums.address, isums.address) AS address,
      COALESCE(osums.output_sum, 0) AS output_sum,
      COALESCE(isums.input_sum, 0) AS input_sum
    FROM
      (SELECT
        o.address,
        SUM(o.amount) AS output_sum
      FROM "Outputs" o
      WHERE o."blockNumber" <= :blockNumber AND 
            o.address IS NOT NULL AND 
            o.asset = '00' AND 
            o.${LOCK_TYPE_FOR_BALANCE}
      GROUP BY address) AS osums
      FULL OUTER JOIN
      (SELECT
        io.address,
        SUM(io.amount) AS input_sum
      FROM
        "Outputs" io
        INNER JOIN "Inputs" i ON i."outputId" = io.id
      WHERE i."blockNumber" <= :blockNumber AND 
            io.address IS NOT NULL AND 
            io.asset = '00' AND 
            io.${LOCK_TYPE_FOR_BALANCE}
      GROUP BY io.address) AS isums
      ON osums.address = isums.address) AS bothsums;
  `;

  return sequelize.query(sql, {
    replacements: {
      blockNumber,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

/**
 * Get all balances (asset/amount) up until blockNumber for an address
 *
 * @param {string} address the address
 * @param {number} blockNumber the block number
 */
addressesDAL.snapshotAddressBalancesByBlock = async function ({
  address,
  blockNumber,
  dbTransaction = null,
} = {}) {
  const sql = tags.oneLine`
  SELECT
    bothsums.asset AS asset,
    (output_sum - input_sum) AS amount
  FROM
    (SELECT
      COALESCE(osums.asset, isums.asset) AS asset,
      COALESCE(osums.output_sum, 0) AS output_sum,
      COALESCE(isums.input_sum, 0) AS input_sum
    FROM
      (SELECT
        o.asset,
        SUM(o.amount) AS output_sum
      FROM "Outputs" o
      WHERE o."blockNumber" <= :blockNumber AND o.address = :address AND o.${LOCK_TYPE_FOR_BALANCE}
      GROUP BY o.asset) AS osums
      FULL OUTER JOIN
      (SELECT
        io.asset,
        SUM(io.amount) AS input_sum
      FROM
        "Outputs" io
        INNER JOIN "Inputs" i ON i."outputId" = io.id
      WHERE i."blockNumber" <= :blockNumber AND io.address = :address AND io.${LOCK_TYPE_FOR_BALANCE}
      GROUP BY io.asset) AS isums
      ON osums.asset = isums.asset) AS bothsums
      WHERE output_sum > input_sum;
  `;

  return sequelize.query(sql, {
    replacements: {
      address,
      blockNumber,
    },
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};
addressesDAL.keyholders = function ({ asset, limit, offset } = {}) {
  const where = {
    [Op.and]: {
      asset,
      balance: {
        [Op.gt]: 0,
      },
    },
  };
  return Promise.all([
    this.count({ where }),
    this.findAll({ where, order: [['balance', 'DESC']], limit, offset }),
  ]).then(this.getItemsAndCountResult);
};

module.exports = addressesDAL;
