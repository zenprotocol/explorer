'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const txsDAL = dal.createDAL('Tx');
const addressTxsDAL = require('../address-txs/addressTxsDAL');
const assetTxsDAL = require('../asset-txs/assetTxsDAL');
const outputsDAL = require('../outputs/outputsDAL');
const isHash = require('../../../lib/isHash');

const sequelize = txsDAL.db.sequelize;
const Op = txsDAL.db.Sequelize.Op;

txsDAL.findByHash = async function (hash) {
  return txsDAL.findOne({
    where: {
      hash,
    },
    include: [
      {
        model: this.db.Block,
      },
    ],
  });
};

txsDAL.search = function (search, limit = 10) {
  const where = {
    hash: {
      [Op.like]: `%${search}%`,
    },
  };
  return Promise.all([
    this.count({ where }),
    this.findAll({
      where,
      include: ['Block'],
      limit,
      order: [['id', 'DESC']],
    }),
  ]);
};

txsDAL.findAllByBlock = async function ({ hashOrBlockNumber, limit, offset } = {}) {
  const blockProp = isHash(hashOrBlockNumber) ? 'hash' : 'blockNumber';
  const sql = tags.oneLine`
  SELECT "Txs".*, 
    "Blocks"."timestamp", 
    CASE WHEN "Txs"."blockNumber" != 1 AND "Txs"."index" = 0 THEN true
        ELSE false
        END AS "isCoinbase"
  FROM "Txs"
  INNER JOIN "Blocks" ON "Txs"."blockNumber" = "Blocks"."blockNumber"
  WHERE "Blocks"."${blockProp}" = :hashOrBlockNumber
  ORDER BY "Txs"."index" ASC
  ${limit ? 'LIMIT :limit' : ''} ${offset ? 'OFFSET :offset' : ''}
  `;

  return sequelize.query(sql, {
    replacements: {
      hashOrBlockNumber,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};
txsDAL.countByBlock = async function ({ hashOrBlockNumber } = {}) {
  const blockProp = isHash(hashOrBlockNumber) ? 'hash' : 'blockNumber';
  return this.count({
    where: {
      [blockProp]: hashOrBlockNumber,
    },
  });
};

txsDAL.findAllByAddress = async function ({ address, limit, offset } = {}) {
  const sql = tags.oneLine`
  SELECT "Txs".*, 
    "Blocks"."timestamp", 
    CASE WHEN "Txs"."blockNumber" != 1 AND "Txs"."index" = 0 THEN true
      ELSE false
      END AS "isCoinbase"
  FROM "AddressTxs"
  INNER JOIN "Txs" ON "AddressTxs"."txId" = "Txs".id
  INNER JOIN "Blocks" ON "AddressTxs"."blockNumber" = "Blocks"."blockNumber"
  WHERE "AddressTxs"."address" = :address
  ORDER BY "AddressTxs"."blockNumber" DESC, "Txs"."index" DESC
  ${limit ? 'LIMIT :limit' : ''} ${offset ? 'OFFSET :offset' : ''}
  `;

  return sequelize.query(sql, {
    replacements: {
      address,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};
txsDAL.countByAddress = async function ({ address } = {}) {
  return addressTxsDAL.count({
    where: {
      address,
    },
  });
};

txsDAL.findAllByAsset = function ({ asset, limit, offset } = {}) {
  const sql = tags.oneLine`
  SELECT "Txs".*, 
    "Blocks"."timestamp", 
    CASE WHEN "Txs"."blockNumber" != 1 AND "Txs"."index" = 0 THEN true
      ELSE false
      END AS "isCoinbase"
  FROM "AssetTxs"
  JOIN "Txs" ON "AssetTxs"."txId" = "Txs".id
  JOIN "Blocks" ON "AssetTxs"."blockNumber" = "Blocks"."blockNumber"
  WHERE "AssetTxs"."asset" = :asset
  ORDER BY "AssetTxs"."blockNumber" DESC, "Txs"."index" DESC
  ${limit ? 'LIMIT :limit' : ''} ${offset ? 'OFFSET :offset' : ''}
`;

  return sequelize.query(sql, {
    replacements: {
      asset,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};
txsDAL.countByAsset = function ({ asset } = {}) {
  return assetTxsDAL.count({ where: { asset } });
};

/**
 * Find all inputs and outputs of a tx, aggregate inputs by address and asset
 */
txsDAL.findAllTxInputsOutputsAggregated = function ({ txId, asset } = {}) {
  const inputsPromise = sequelize.query(
    tags.oneLine`
      SELECT MAX(id) AS id, address, asset, SUM(amount) AS amount, "isMint"
      FROM "Inputs"
      WHERE "txId" = :txId
        ${asset ? 'AND asset = :asset' : ''}
      GROUP BY address, asset, "isMint"
      ORDER BY asset, MAX(index);
    `,
    {
      replacements: { txId, asset },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const outputsPromise = outputsDAL.findAll({
    where: Object.assign(
      {
        txId,
      },
      asset ? { asset } : {} // filter by asset only if given
    ),
    order: ['asset', 'index'],
  });

  return Promise.all([inputsPromise, outputsPromise]).then(([inputs, outputs]) => {
    return {
      inputs,
      outputs,
    };
  });
};

module.exports = txsDAL;
