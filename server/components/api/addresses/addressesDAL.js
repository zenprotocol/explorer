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

const LOCK_TYPE_FOR_BALANCE = "\"lockType\" IN ('Coinbase','PK','Contract','Destroy')";

addressesDAL.findByAddressAsset = function ({ address, asset, ...options } = {}) {
  return this.findAll({
    where: {
      address,
      asset,
    },
    limit: 1,
    ...options,
  }).then((results) => {
    return results.length ? results[0] : null;
  });
};

addressesDAL.findAllByAddress = function (address, options) {
  return this.findAll({
    where: {
      address,
      balance: {
        [Op.gt]: 0,
      },
    },
    order: [
      [sequelize.literal('CASE WHEN "asset" = \'00\' THEN 0 ELSE 1 END'), 'ASC'],
      ['balance', 'DESC'],
    ],
    ...options,
  });
};

addressesDAL.search = async function (search, limit = 10) {
  const like = AddressUtils.isAddress(search) ? `${search}%` : `%${search}%`;
  const prefix = AddressUtils.getPrefix(((await infosDAL.findByName('chain')) || {}).value);
  const where = {
    address: {
      [Op.like]: like,
      [Op.notLike]: `c${prefix}%`,
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
    COALESCE(osums.address, isums.address) AS address,
    osums.output_sum,
    isums.input_sum,
    COALESCE(osums.output_sum, 0) - COALESCE(isums.input_sum, 0) AS amount
  FROM
    (SELECT
      o.address,
      SUM(o.amount) AS output_sum
    FROM "Outputs" o
    WHERE o."blockNumber" <= :blockNumber AND 
          o.address IS NOT NULL AND 
          o.asset = '00'
    GROUP BY address) AS osums
    FULL OUTER JOIN
    (SELECT
      i.address,
      SUM(i.amount) AS input_sum
    FROM
      "Inputs" i
    WHERE i."blockNumber" <= :blockNumber AND 
          i.address IS NOT NULL AND 
          i.asset = '00'
    GROUP BY i.address) AS isums
    ON osums.address = isums.address
    WHERE COALESCE(osums.output_sum, 0) != COALESCE(isums.input_sum, 0);
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
