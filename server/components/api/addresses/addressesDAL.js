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

addressesDAL.addressExists = function (address, options) {
  return this.findAll({
    where: {
      address,
    },
    limit: 1,
    ...options,
  }).then((results) => results.length > 0);
};

/**
 * Find all address/asset from the Addresses table
 * For ZP, return a row even if the balance is 0, for the rest, no
 * @param {string} address
 * @param {Object} options
 */
addressesDAL.findAllByAddress = function (address, options) {
  return this.findAll({
    where: {
      address,
      [Op.or]: [
        {
          asset: '00',
        },
        {
          asset: {
            [Op.ne]: '00',
          },
          balance: {
            [Op.gt]: 0,
          },
        },
      ],
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

/**
 * Calculates all up-to-current-block amounts (input_sum, output_sum, balance) for all addresses per asset
 * taking care of change within a transaction
 */
addressesDAL.snapshotCurrentAmountsForAll = async function ({ dbTransaction = null } = {}) {
  // sql includes comments, not using tags.oneLine
  const sql = `
  SELECT
    bothsums_per_tx.address AS address,
    bothsums_per_tx.asset AS asset,
    SUM(bothsums_per_tx.input_sum) AS input_sum,
    SUM(bothsums_per_tx.output_sum) AS output_sum,
    (SUM(bothsums_per_tx.output_sum) - SUM(bothsums_per_tx.input_sum)) AS balance
  FROM
    ( 
      -- combine inputs and outputs taking care of change in a TX
      SELECT
        COALESCE(osums.address, isums.address) AS address,
        COALESCE(osums.asset, isums.asset) AS asset,
        CASE WHEN isums.input_sum > 0 
          THEN isums.input_sum - COALESCE(osums.output_sum, 0)
          ELSE 0
          END AS "input_sum",
        CASE WHEN isums.input_sum > 0 
          THEN 0
          ELSE COALESCE(osums.output_sum, 0)
          END AS "output_sum" 
      FROM
        ( 
          -- outputs per TX
          SELECT
            o.asset,
            o.address,
            o."txId",
            SUM(o.amount) AS output_sum
          FROM "Outputs" o
          WHERE o.address IS NOT NULL AND o.${LOCK_TYPE_FOR_BALANCE}
          GROUP BY o.asset, o.address, o."txId"
        ) AS osums
        FULL OUTER JOIN
        ( -- inputs per TX
          SELECT
            io.asset,
            io.address,
            i."txId",
            SUM(io.amount) AS input_sum
          FROM
            "Outputs" io
            INNER JOIN "Inputs" i ON i."outputId" = io.id
          WHERE io.address IS NOT NULL AND io.${LOCK_TYPE_FOR_BALANCE}
          GROUP BY io.asset, io.address, i."txId"
        ) AS isums
        ON osums.asset = isums.asset 
          AND osums.address = isums.address 
          AND osums."txId" = isums."txId"
    ) AS bothsums_per_tx
    GROUP BY bothsums_per_tx.address, bothsums_per_tx.asset;
  `;

  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};

addressesDAL.countTxsPerAddress = async function ({ dbTransaction } = {}) {
  // sql includes comments, not using tags.oneLine
  const sql = `
  SELECT
    ins_outs.address AS address,
    COUNT(*) AS "txsCount"
  FROM
    ( 
      -- combine inputs and outputs
      SELECT
        COALESCE(outs.address, ins.address) AS address,
        COALESCE(outs."txId", ins."txId") AS "txId"
      FROM
        ( 
          -- outputs per TX
          SELECT
            o.address,
            o."txId"
          FROM "Outputs" o
          WHERE o.address IS NOT NULL AND o.${LOCK_TYPE_FOR_BALANCE}
          GROUP BY o.address, o."txId"
        ) AS outs
        FULL OUTER JOIN
        ( -- inputs per TX
          SELECT
            io.address,
            i."txId"
          FROM
            "Outputs" io
            INNER JOIN "Inputs" i ON i."outputId" = io.id
          WHERE io.address IS NOT NULL AND io.${LOCK_TYPE_FOR_BALANCE}
          GROUP BY io.address, i."txId"
        ) AS ins
        ON outs.address = ins.address 
          AND outs."txId" = ins."txId"
    ) AS ins_outs
  GROUP BY ins_outs.address;
  `;

  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};

/**
 * Calculate and inserts all unique address transactions from Inputs and Outputs
 */
addressesDAL.insertAllAddressTxs = async function ({ dbTransaction } = {}) {
  // sql includes comments, not using tags.oneLine
  const sql = `
  INSERT INTO "AddressTxs"
  SELECT
    -- fields must be in the same order as defined in "AddressTxs"
    COALESCE(osums."blockNumber", isums."blockNumber") AS "blockNumber",
    COALESCE(osums."txId", isums."txId") AS "txId",
    COALESCE(osums.address, isums.address) AS "address"
  FROM
    ( 
      -- outputs per TX
      SELECT
        o.address,
        o."txId",
        o."blockNumber"
      FROM "Outputs" o
      WHERE o.address IS NOT NULL AND o."lockType" IN ('Coinbase','PK','Contract','Destroy')
      GROUP BY o.address, o."txId", o."blockNumber"
    ) AS osums
    FULL OUTER JOIN
    ( -- inputs per TX
      SELECT
        io.address,
        i."txId",
        i."blockNumber"
      FROM
        "Outputs" io
        INNER JOIN "Inputs" i ON i."outputId" = io.id
      WHERE io.address IS NOT NULL AND io."lockType" IN ('Coinbase','PK','Contract','Destroy')
      GROUP BY io.address, i."txId", i."blockNumber"
    ) AS isums
    ON osums.address = isums.address 
      AND osums."txId" = isums."txId";
  `;

  return sequelize.query(sql, {
    type: db.Sequelize.QueryTypes.INSERT,
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

addressesDAL.countKeyholdersPerAsset = async function ({ dbTransaction } = {}) {
  const sql = `
  SELECT
    asset, COUNT(address) as keyholders
  FROM "Addresses"
  WHERE balance > 0
  GROUP BY asset;
  `;

  return sequelize.query(sql, {
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};

module.exports = addressesDAL;
