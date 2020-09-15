'use strict';

const tags = require('common-tags');
const deepMerge = require('deepmerge');
const dal = require('../../../lib/dal');
const txsDAL = dal.createDAL('Tx');
const blocksDAL = require('../blocks/blocksDAL');
const inputsDAL = require('../inputs/inputsDAL');
const outputsDAL = require('../outputs/outputsDAL');
const isHash = require('../../../lib/isHash');
const getFieldsForSelectQuery = require('../../../lib/getFieldsForSelectQuery');

const sequelize = txsDAL.db.sequelize;
const Op = txsDAL.db.Sequelize.Op;

const LOCK_TYPE_FOR_BALANCE = '"lockType" IN (\'Coinbase\',\'PK\',\'Contract\',\'Destroy\')';

txsDAL.findByHash = async function(hash) {
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

txsDAL.search = function(search, limit = 10) {
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

txsDAL.findAllAssetsByAddress = async function(address, { limit = 10, offset = 0 }) {
  const sql = tags.oneLine`
  SELECT
      COALESCE("OutputAsset"."asset", "InputAsset"."asset") AS "asset",
      "Block"."timestamp" AS "timestamp",
      "Block"."hash" AS "blockHash",
      "Block"."blockNumber" AS "blockNumber",
      "Tx"."id" AS "transactionId",
      "Tx"."hash" AS "txHash",
      CASE WHEN "Tx"."index" = 0 THEN true
          ELSE false
          END AS "isCoinbaseTx",
      COALESCE("OutputAsset"."outputSum", 0) AS "outputSum",
      COALESCE("InputAsset"."inputSum", 0) AS "inputSum",
      COALESCE("outputSum", 0) -  COALESCE("inputSum", 0) AS "totalSum"
  FROM
      (SELECT SUM("Output"."amount") AS "outputSum",
          "Output"."asset",
          "Output"."txId"
      FROM "Outputs" AS "Output"
      WHERE "Output"."address" = :address AND "Output".${LOCK_TYPE_FOR_BALANCE}
      GROUP BY "Output"."txId", "Output"."asset") AS "OutputAsset"

      FULL OUTER JOIN

      (SELECT SUM("Output"."amount") AS "inputSum",
          "Output"."asset",
          "Input"."txId"
      FROM "Inputs" AS "Input"
          INNER JOIN "Outputs" as "Output" ON "Input"."outputId" = "Output"."id"
      WHERE "Output"."address" = :address AND "Output".${LOCK_TYPE_FOR_BALANCE}
      GROUP BY "Input"."txId", "Output"."asset") AS "InputAsset"

      ON "OutputAsset"."txId" = "InputAsset"."txId"
          AND "OutputAsset"."asset" = "InputAsset"."asset"
      INNER JOIN "Txs" AS "Tx" ON "OutputAsset"."txId" = "Tx"."id" OR "InputAsset"."txId" = "Tx"."id"
      INNER JOIN "Blocks" AS "Block" ON "Tx"."blockNumber" = "Block"."blockNumber"
  ORDER BY "Block"."timestamp" DESC
  LIMIT :limit OFFSET :offset`;

  return sequelize.query(sql, {
    replacements: {
      address,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

txsDAL.findAllByBlockNumber = async function(blockNumber, options = { limit: 10 }) {
  const blockDB = await blocksDAL.findById(blockNumber);
  return blockDB.getTransactions(
    deepMerge.all([
      {
        include: [
          {
            model: this.db.Block,
          },
          'Outputs',
          {
            model: this.db.Input,
            include: ['Output'],
          },
        ],
      },
      options,
      {
        order: [[this.db.Input, 'index'], [this.db.Output, 'index']],
      },
    ])
  );
};

txsDAL.findAllByAddress = async function(
  address,
  options = { limit: 10, offset: 0, ascending: false }
) {
  const transactionsSelectFields = getFieldsForSelectQuery(
    txsDAL.db.Tx,
    'Tx',
    true
  );
  const blocksSelectFields = getFieldsForSelectQuery(txsDAL.db.Block, 'Block', false);
  const order = options.ascending ? 'ASC' : 'DESC';
  const sql = tags.oneLine`
  SELECT ${transactionsSelectFields}, ${blocksSelectFields}, COALESCE("Executions"."command", '') AS "firstExecution"
    FROM
      (SELECT "txId" 
        FROM "Outputs" 
        WHERE "Outputs"."address" = :address
        GROUP BY "txId") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."txId" 
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."outputId" = "Outputs"."id" 
        AND "Outputs"."address" = :address
        GROUP BY "Inputs"."txId" ) AS "Inputs"
      ON "Outputs"."txId" = "Inputs"."txId"
      INNER JOIN "Txs" AS "Tx" ON "Outputs"."txId" = "Tx"."id" OR "Inputs"."txId" = "Tx"."id"
      LEFT JOIN (SELECT * FROM "Executions" INNER JOIN "Contracts" ON "Executions"."contractId" = "Contracts"."id" AND "Contracts"."address" = :address ORDER BY "Executions"."indexInTx"
      ) AS "Executions" ON "Tx"."id" = "Executions"."txId"
      INNER JOIN "Blocks" AS "Block" ON "Tx"."blockNumber" = "Block"."blockNumber"
      ORDER BY "Block"."timestamp" ${order}
      LIMIT :limit OFFSET :offset`;

  return sequelize.query(sql, {
    replacements: {
      address,
      limit: options.limit,
      offset: options.offset,
    },
    type: sequelize.QueryTypes.SELECT,
    raw: false,
    nest: true,
  });
};

txsDAL.findAllAssetsByBlock = async function(
  hashOrBlockNumber,
  { limit = 10, offset = 0 } = {}
) {
  const blockProp = isHash(hashOrBlockNumber) ? 'hash' : 'blockNumber';
  const sql = tags.oneLine`
  WITH "AddressAmounts" AS ( 
    SELECT 
      COALESCE("OutputAsset"."txId", "InputAsset"."txId") AS "txId",
      COALESCE("OutputAsset"."asset", "InputAsset"."asset") AS "asset",
      COALESCE("OutputAsset"."address", "InputAsset"."address") AS "address",
      COALESCE("OutputAsset"."outputSum", 0) AS "outputSum",
      COALESCE("InputAsset"."inputSum", 0) AS "inputSum"
    FROM
      (SELECT SUM("Output"."amount") AS "outputSum",
        "Output"."asset",
        "Output"."address",
        "Output"."txId"
      FROM "Outputs" AS "Output"
        JOIN "Txs" ON "Output"."txId" = "Txs"."id"
        JOIN "Blocks" ON "Txs"."blockNumber" = "Blocks"."blockNumber" AND "Blocks"."${blockProp}" = :hashOrBlockNumber
      WHERE "Output".${LOCK_TYPE_FOR_BALANCE}
      GROUP BY "Output"."txId", "Output"."asset", "Output"."address") AS "OutputAsset"
  
      FULL OUTER JOIN
  
      (SELECT SUM("Output"."amount") AS "inputSum",
        "Output"."asset",
        "Output"."address",
        "Input"."txId"
      FROM "Inputs" AS "Input"
        INNER JOIN "Outputs" as "Output" ON "Input"."outputId" = "Output"."id"
        JOIN "Txs" ON "Input"."txId" = "Txs"."id"
        JOIN "Blocks" ON "Txs"."blockNumber" = "Blocks"."blockNumber" AND "Blocks"."${blockProp}" = :hashOrBlockNumber
      WHERE "Output".${LOCK_TYPE_FOR_BALANCE}
      GROUP BY "Input"."txId", "Output"."asset", "Output"."address") AS "InputAsset"
  
      ON "OutputAsset"."txId" = "InputAsset"."txId"
        AND "OutputAsset"."asset" = "InputAsset"."asset"
        AND "OutputAsset"."address" = "InputAsset"."address"
  )
  
  SELECT 
    "AllAmounts"."asset",
    "Block"."timestamp" AS "timestamp",
    "Block"."hash" AS "blockHash",
    "Tx"."id" AS "transactionId",
    "Tx"."hash" AS "txHash",
    CASE WHEN "Tx"."index" = 0 THEN true
            ELSE false
            END AS "isCoinbaseTx",
    "AllAmounts"."outputSum",
    "AllAmounts"."inputSum",
    "AllAmounts"."totalMoved",
    "AllAmounts"."totalSum"
  FROM
    (SELECT
      "AddressAmounts"."txId",
      "AddressAmounts"."asset",
      sum("AddressAmounts"."outputSum") AS "outputSum",
      sum("AddressAmounts"."inputSum") AS "inputSum",
      max("TotalMoved"."total") AS "totalMoved",
      sum("AddressAmounts"."outputSum") -  sum("AddressAmounts"."inputSum") AS "totalSum"
    FROM
      "AddressAmounts"
      LEFT JOIN
      (SELECT 
        SUM("AddressAmounts"."outputSum") AS "total", 
        "AddressAmounts"."txId",
        "AddressAmounts"."asset"
        FROM "AddressAmounts"
        WHERE "AddressAmounts"."inputSum" = 0
        GROUP BY 
        "AddressAmounts"."txId", "AddressAmounts"."asset"
      ) AS "TotalMoved"
      ON "AddressAmounts"."txId" = "TotalMoved"."txId"
      AND "AddressAmounts"."asset" = "TotalMoved"."asset"
    GROUP BY 
        "AddressAmounts"."txId", "AddressAmounts"."asset") AS "AllAmounts"
  INNER JOIN "Txs" AS "Tx" ON "AllAmounts"."txId" = "Tx"."id"
  INNER JOIN "Blocks" AS "Block" ON "Tx"."blockNumber" = "Block"."blockNumber"
  ORDER BY "Tx"."index"
  LIMIT :limit OFFSET :offset
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

txsDAL.countByAddress = async function(address) {
  const sql = tags.oneLine`
  SELECT COUNT(*)
    FROM
      (SELECT "txId" 
        FROM "Outputs" 
        WHERE "Outputs"."address" = :address
        GROUP BY "txId") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."txId" 
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."outputId" = "Outputs"."id" 
        AND "Outputs"."address" = :address
        GROUP BY "Inputs"."txId" ) AS "Inputs"
      ON "Outputs"."txId" = "Inputs"."txId"`;

  return sequelize
    .query(sql, {
      replacements: {
        address,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(result => {
      return result.length ? result[0].count : 0;
    });
};

txsDAL.countAssetsByAddress = async function(address) {
  const sql = tags.oneLine`
  SELECT COUNT(*)
    FROM
      (SELECT "Output"."txId",
            "Output"."asset"
      FROM "Outputs" AS "Output"
      WHERE "Output"."address" = :address
      GROUP BY "Output"."txId", "Output"."asset") AS "OutputAsset"
    FULL OUTER JOIN
      (SELECT "Input"."txId",
              "Output"."asset"
      FROM "Inputs" AS "Input"
      INNER JOIN "Outputs" as "Output" ON "Input"."outputId" = "Output"."id"
      WHERE "Output"."address" = :address
      GROUP BY "Input"."txId", "Output"."asset") AS "InputAsset" 
    ON "OutputAsset"."txId" = "InputAsset"."txId"
    AND "OutputAsset"."asset" = "InputAsset"."asset"`;

  return sequelize
    .query(sql, {
      replacements: {
        address,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(result => {
      return result.length ? result[0].count : 0;
    });
};

txsDAL.countAssetsByBlock = async function(hashOrBlockNumber) {
  const blockProp = isHash(hashOrBlockNumber) ? 'hash' : 'blockNumber';
  const sql = tags.oneLine`
  SELECT COUNT(*)
  FROM
    (SELECT SUM("Output"."amount") AS "outputSum",
      "Output"."asset",
      "Output"."txId"
    FROM "Outputs" AS "Output"
      JOIN "Txs" ON "Output"."txId" = "Txs"."id"
      JOIN "Blocks" ON "Txs"."blockNumber" = "Blocks"."blockNumber" AND "Blocks"."${blockProp}" = :hashOrBlockNumber
    GROUP BY "Output"."txId", "Output"."asset") AS "OutputAsset"

    FULL OUTER JOIN

    (SELECT SUM("Output"."amount") AS "inputSum",
      "Output"."asset",
      "Input"."txId"
    FROM "Inputs" AS "Input"
      INNER JOIN "Outputs" as "Output" ON "Input"."outputId" = "Output"."id"
      JOIN "Txs" ON "Input"."txId" = "Txs"."id"
      JOIN "Blocks" ON "Txs"."blockNumber" = "Blocks"."blockNumber" AND "Blocks"."${blockProp}" = :hashOrBlockNumber
    GROUP BY "Input"."txId", "Output"."asset") AS "InputAsset"

    ON "OutputAsset"."txId" = "InputAsset"."txId"
      AND "OutputAsset"."asset" = "InputAsset"."asset"`;

  return sequelize
    .query(sql, {
      replacements: {
        hashOrBlockNumber,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(result => {
      return result.length ? result[0].count : 0;
    });
};

txsDAL.countByBlockNumber = async function(blockNumber) {
  return this.count({
    include: [
      {
        model: this.db.Block,
        where: {
          blockNumber,
        },
      },
    ],
  });
};

txsDAL.findTransactionAssetInputsOutputs = function(id, asset) {
  const inputsPromise = inputsDAL.findAll({
    attributes: [
      [sequelize.col('Output.address'), 'address'],
      [sequelize.fn('MAX', sequelize.col('Output.lockType')), 'lockType'],
      [sequelize.fn('MAX', sequelize.col('Input.index')), 'index'],
    ],
    where: {
      txId: id,
    },
    include: [
      {
        model: this.db.Output,
        attributes: [],
        where: {
          asset,
        },
      },
    ],
    group: [sequelize.col('Output.address')],
    order: [sequelize.literal('"index"')],
  });

  const outputsPromise = outputsDAL.findAll({
    attributes: ['address', 'lockType', 'amount'],
    where: {
      [Op.and]: {
        txId: id,
        asset,
      },
    },
    order: ['index'],
  });

  return Promise.all([inputsPromise, outputsPromise]).then(([inputs, Outputs]) => {
    // todo - change ui that we will not have to do this
    const Inputs = inputs.map((input, index) => ({
      id: index + 1,
      Output: {
        address: input.get('address'),
        lockType: input.get('lockType'),
      },
    }));
    return {
      Inputs,
      Outputs,
    };
  });
};

txsDAL.findAllTransactionAssetsInputsOutputs = function(id) {
  const inputsPromise = inputsDAL.findAll({
    attributes: [
      [sequelize.col('Output.asset'), 'asset'],
      [sequelize.col('Output.address'), 'address'],
      [sequelize.fn('MAX', sequelize.col('Output.lockType')), 'lockType'],
      [sequelize.fn('MAX', sequelize.col('Input.index')), 'index'],
    ],
    where: {
      txId: id,
    },
    include: [
      {
        model: this.db.Output,
        attributes: [],
        required: true,
      },
    ],
    group: [sequelize.col('Output.asset'), sequelize.col('Output.address')],
    order: [sequelize.col('Output.asset'), sequelize.literal('"index"')],
  });

  const outputsPromise = outputsDAL.findAll({
    attributes: ['asset', 'address', 'lockType', 'amount'],
    where: {
      [Op.and]: {
        txId: id,
      },
    },
    order: ['asset', 'index'],
  });

  return Promise.all([inputsPromise, outputsPromise]).then(([inputs, Outputs]) => {
    // todo - change ui that we will not have to do this
    const Inputs = inputs.map((input, index) => ({
      id: index + 1,
      Output: {
        asset: input.get('asset'),
        address: input.get('address'),
        lockType: input.get('lockType'),
      },
    }));
    return {
      Inputs,
      Outputs,
    };
  });
};

module.exports = txsDAL;
