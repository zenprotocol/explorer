'use strict';

const tags = require('common-tags');
const deepMerge = require('deepmerge');
const dal = require('../../../lib/dal');
const transactionsDAL = dal.createDAL('Transaction');
const blocksDAL = require('../blocks/blocksDAL');
const inputsDAL = require('../inputs/inputsDAL');
const outputsDAL = require('../outputs/outputsDAL');
const isHash = require('../../../lib/isHash');
const getFieldsForSelectQuery = require('../../../lib/getFieldsForSelectQuery');

const sequelize = transactionsDAL.db.sequelize;

transactionsDAL.findByHash = async function(hash) {
  return transactionsDAL.findOne({
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

transactionsDAL.search = function(search, limit = 10) {
  const where = {
    hash: {
      [sequelize.Op.like]: `%${search}%`,
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

transactionsDAL.findAllAssetsByAddress = async function(address, { limit = 10, offset = 0 }) {
  const sql = tags.oneLine`
  SELECT
      COALESCE("OutputAsset"."asset", "InputAsset"."asset") AS "asset",
      "Block"."timestamp" AS "timestamp",
      "Block"."hash" AS "blockHash",
      "Block"."blockNumber" AS "blockNumber",
      "Transaction"."id" AS "transactionId",
      "Transaction"."hash" AS "txHash",
      CASE WHEN "Transaction"."index" = 0 THEN true
          ELSE false
          END AS "isCoinbaseTx",
      COALESCE("OutputAsset"."outputSum", 0) AS "outputSum",
      COALESCE("InputAsset"."inputSum", 0) AS "inputSum",
      COALESCE("outputSum", 0) -  COALESCE("inputSum", 0) AS "totalSum"
  FROM
      (SELECT SUM("Output"."amount") AS "outputSum",
          "Output"."asset",
          "Output"."TransactionId"
      FROM "Outputs" AS "Output"
      WHERE "Output"."address" = :address
      GROUP BY "Output"."TransactionId", "Output"."asset") AS "OutputAsset"

      FULL OUTER JOIN

      (SELECT SUM("Output"."amount") AS "inputSum",
          "Output"."asset",
          "Input"."TransactionId"
      FROM "Inputs" AS "Input"
          INNER JOIN "Outputs" as "Output" ON "Input"."OutputId" = "Output"."id"
      WHERE "address" = :address
      GROUP BY "Input"."TransactionId", "Output"."asset") AS "InputAsset"

      ON "OutputAsset"."TransactionId" = "InputAsset"."TransactionId"
          AND "OutputAsset"."asset" = "InputAsset"."asset"
      INNER JOIN "Transactions" AS "Transaction" ON "OutputAsset"."TransactionId" = "Transaction"."id" OR "InputAsset"."TransactionId" = "Transaction"."id"
      INNER JOIN "Blocks" AS "Block" ON "Transaction"."BlockId" = "Block"."id"
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

transactionsDAL.findAllByBlockNumber = async function(blockNumber, options = { limit: 10 }) {
  const blockDB = await blocksDAL.findByBlockNumber(blockNumber);
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

transactionsDAL.findAllByAddress = async function(
  address,
  options = { limit: 10, offset: 0, ascending: false }
) {
  const transactionsSelectFields = getFieldsForSelectQuery(
    transactionsDAL.db.Transaction,
    'Transaction',
    true
  );
  const blocksSelectFields = getFieldsForSelectQuery(transactionsDAL.db.Block, 'Block', false);
  const order = options.ascending ? 'ASC' : 'DESC';
  const sql = tags.oneLine`
  SELECT ${transactionsSelectFields}, ${blocksSelectFields}, COALESCE("Commands"."command", '') AS "firstCommand"
    FROM
      (SELECT "TransactionId" 
        FROM "Outputs" 
        WHERE "Outputs"."address" = :address
        GROUP BY "TransactionId") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."TransactionId" 
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."OutputId" = "Outputs"."id" 
        AND "Outputs"."address" = :address
        GROUP BY "Inputs"."TransactionId" ) AS "Inputs"
      ON "Outputs"."TransactionId" = "Inputs"."TransactionId"
      INNER JOIN "Transactions" AS "Transaction" ON "Outputs"."TransactionId" = "Transaction"."id" OR "Inputs"."TransactionId" = "Transaction"."id"
      LEFT JOIN (SELECT * FROM "Commands" INNER JOIN "Contracts" ON "Commands"."ContractId" = "Contracts"."id" AND "Contracts"."address" = :address ORDER BY "Commands"."indexInTransaction"
      ) AS "Commands" ON "Transaction"."id" = "Commands"."TransactionId"
      INNER JOIN "Blocks" AS "Block" ON "Transaction"."BlockId" = "Block"."id"
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

transactionsDAL.findAllByAsset = async function(
  asset,
  options = { limit: 10, offset: 0, ascending: false }
) {
  const order = options.ascending ? 'ASC' : 'DESC';
  const sql = tags.oneLine`
  SELECT 
    :asset AS "asset",
    COALESCE("Outputs"."outputSum", 0) AS "outputSum",
    COALESCE("Inputs"."inputSum", 0) AS "inputSum",
    COALESCE("outputSum", 0) -  COALESCE("inputSum", 0) AS "totalSum",
    "Transaction"."id" as "transactionId",
    "Transaction"."hash",
    "Block"."timestamp",
    "Block"."blockNumber"
    FROM
      (SELECT "TransactionId", SUM("Outputs"."amount") as "outputSum"
        FROM "Outputs" 
        WHERE "Outputs"."asset" = :asset
        GROUP BY "TransactionId") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."TransactionId", SUM("Outputs"."amount") AS "inputSum"
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."OutputId" = "Outputs"."id" 
        AND "Outputs"."asset" = :asset
        GROUP BY "Inputs"."TransactionId" ) AS "Inputs"
      ON "Outputs"."TransactionId" = "Inputs"."TransactionId"
      INNER JOIN "Transactions" AS "Transaction" ON "Outputs"."TransactionId" = "Transaction"."id" OR "Inputs"."TransactionId" = "Transaction"."id"
      INNER JOIN "Blocks" AS "Block" ON "Transaction"."BlockId" = "Block"."id"
      ORDER BY "Block"."timestamp" ${order}
      LIMIT :limit OFFSET :offset`;

  return sequelize.query(sql, {
    replacements: {
      asset,
      limit: options.limit,
      offset: options.offset,
    },
    type: sequelize.QueryTypes.SELECT,
    raw: false,
    nest: true,
  });
};

transactionsDAL.findAllAssetsByBlock = async function(
  hashOrBlockNumber,
  { limit = 10, offset = 0 }
) {
  const blockProp = isHash(hashOrBlockNumber) ? 'hash' : 'blockNumber';
  const sql = tags.oneLine`
  SELECT
    COALESCE("OutputAsset"."asset", "InputAsset"."asset") AS "asset",
    "Block"."timestamp" AS "timestamp",
    "Block"."hash" AS "blockHash",
    "Transaction"."id" AS "transactionId",
    "Transaction"."hash" AS "txHash",
    CASE WHEN "Transaction"."index" = 0 THEN true
            ELSE false
            END AS "isCoinbaseTx",
    COALESCE("OutputAsset"."outputSum", 0) AS "outputSum",
    COALESCE("InputAsset"."inputSum", 0) AS "inputSum",
    COALESCE("outputSum", 0) -  COALESCE("inputSum", 0) AS "totalSum"
  FROM
    (SELECT SUM("Output"."amount") AS "outputSum",
      "Output"."asset",
      "Output"."TransactionId"
    FROM "Outputs" AS "Output"
      JOIN "Transactions" ON "Output"."TransactionId" = "Transactions"."id"
      JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id" AND "Blocks"."${blockProp}" = :hashOrBlockNumber
    GROUP BY "Output"."TransactionId", "Output"."asset") AS "OutputAsset"

    FULL OUTER JOIN

    (SELECT SUM("Output"."amount") AS "inputSum",
      "Output"."asset",
      "Input"."TransactionId"
    FROM "Inputs" AS "Input"
      INNER JOIN "Outputs" as "Output" ON "Input"."OutputId" = "Output"."id"
      JOIN "Transactions" ON "Input"."TransactionId" = "Transactions"."id"
      JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id" AND "Blocks"."${blockProp}" = :hashOrBlockNumber
    GROUP BY "Input"."TransactionId", "Output"."asset") AS "InputAsset"

    ON "OutputAsset"."TransactionId" = "InputAsset"."TransactionId"
      AND "OutputAsset"."asset" = "InputAsset"."asset"
    INNER JOIN "Transactions" AS "Transaction" ON "OutputAsset"."TransactionId" = "Transaction"."id" OR "InputAsset"."TransactionId" = "Transaction"."id"
    INNER JOIN "Blocks" AS "Block" ON "Transaction"."BlockId" = "Block"."id"
  WHERE "Block"."${blockProp}" = :hashOrBlockNumber
  ORDER BY "Transaction"."index"
  LIMIT :limit OFFSET :offset`;

  return sequelize.query(sql, {
    replacements: {
      hashOrBlockNumber,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

transactionsDAL.countByAddress = async function(address) {
  const sql = tags.oneLine`
  SELECT COUNT(*)
    FROM
      (SELECT "TransactionId" 
        FROM "Outputs" 
        WHERE "Outputs"."address" = :address
        GROUP BY "TransactionId") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."TransactionId" 
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."OutputId" = "Outputs"."id" 
        AND "Outputs"."address" = :address
        GROUP BY "Inputs"."TransactionId" ) AS "Inputs"
      ON "Outputs"."TransactionId" = "Inputs"."TransactionId"`;

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

transactionsDAL.countAssetsByAddress = async function(address) {
  const sql = tags.oneLine`
  SELECT COUNT(*)
    FROM
      (SELECT "Output"."TransactionId",
            "Output"."asset"
      FROM "Outputs" AS "Output"
      WHERE "Output"."address" = :address
      GROUP BY "Output"."TransactionId", "Output"."asset") AS "OutputAsset"
    FULL OUTER JOIN
      (SELECT "Input"."TransactionId",
              "Output"."asset"
      FROM "Inputs" AS "Input"
      INNER JOIN "Outputs" as "Output" ON "Input"."OutputId" = "Output"."id"
      WHERE "address" = :address
      GROUP BY "Input"."TransactionId", "Output"."asset") AS "InputAsset" 
    ON "OutputAsset"."TransactionId" = "InputAsset"."TransactionId"
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

transactionsDAL.countAssetsByBlock = async function(hashOrBlockNumber) {
  const blockProp = isHash(hashOrBlockNumber) ? 'hash' : 'blockNumber';
  const sql = tags.oneLine`
  SELECT COUNT(*)
  FROM
    (SELECT SUM("Output"."amount") AS "outputSum",
      "Output"."asset",
      "Output"."TransactionId"
    FROM "Outputs" AS "Output"
      JOIN "Transactions" ON "Output"."TransactionId" = "Transactions"."id"
      JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id" AND "Blocks"."${blockProp}" = :hashOrBlockNumber
    GROUP BY "Output"."TransactionId", "Output"."asset") AS "OutputAsset"

    FULL OUTER JOIN

    (SELECT SUM("Output"."amount") AS "inputSum",
      "Output"."asset",
      "Input"."TransactionId"
    FROM "Inputs" AS "Input"
      INNER JOIN "Outputs" as "Output" ON "Input"."OutputId" = "Output"."id"
      JOIN "Transactions" ON "Input"."TransactionId" = "Transactions"."id"
      JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id" AND "Blocks"."${blockProp}" = :hashOrBlockNumber
    GROUP BY "Input"."TransactionId", "Output"."asset") AS "InputAsset"

    ON "OutputAsset"."TransactionId" = "InputAsset"."TransactionId"
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

transactionsDAL.countByBlockNumber = async function(blockNumber) {
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

transactionsDAL.countByAsset = async function(asset) {
  const sql = tags.oneLine`
  SELECT COUNT(*)
    FROM
      (SELECT "TransactionId" 
        FROM "Outputs" 
        WHERE "Outputs"."asset" = :asset
        GROUP BY "TransactionId") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."TransactionId" 
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."OutputId" = "Outputs"."id" 
        AND "Outputs"."asset" = :asset
        GROUP BY "Inputs"."TransactionId" ) AS "Inputs"
      ON "Outputs"."TransactionId" = "Inputs"."TransactionId"`;

  return sequelize
    .query(sql, {
      replacements: {
        asset,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(result => {
      return result.length ? result[0].count : 0;
    });
};

transactionsDAL.findTransactionAssetInputsOutputs = function(id, asset) {
  const inputsPromise = inputsDAL.findAll({
    attributes: [
      [sequelize.col('Output.address'), 'address'],
      [sequelize.fn('MAX', sequelize.col('Output.lockType')), 'lockType'],
      [sequelize.fn('MAX', sequelize.col('Input.index')), 'index'],
    ],
    where: {
      TransactionId: id,
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
      [sequelize.Op.and]: {
        TransactionId: id,
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

transactionsDAL.findAllTransactionAssetsInputsOutputs = function(id) {
  const inputsPromise = inputsDAL.findAll({
    attributes: [
      [sequelize.col('Output.asset'), 'asset'],
      [sequelize.col('Output.address'), 'address'],
      [sequelize.fn('MAX', sequelize.col('Output.lockType')), 'lockType'],
      [sequelize.fn('MAX', sequelize.col('Input.index')), 'index'],
    ],
    where: {
      TransactionId: id,
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
      [sequelize.Op.and]: {
        TransactionId: id,
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

transactionsDAL.addInput = async function(transaction, input, options = {}) {
  return transaction.addInput(input, options);
};
transactionsDAL.addInput = transactionsDAL.addInput.bind(transactionsDAL);

transactionsDAL.addOutput = async function(transaction, output, options = {}) {
  return transaction.addOutput(output, options);
};
transactionsDAL.addOutput = transactionsDAL.addOutput.bind(transactionsDAL);

function getFirstTransactionIdWhereOption(firstTransactionId, ascending) {
  const operator = ascending
    ? transactionsDAL.db.Sequelize.Op.gte
    : transactionsDAL.db.Sequelize.Op.lte;
  return firstTransactionId && Number(firstTransactionId) > 0
    ? {
        id: {
          [operator]: Number(firstTransactionId),
        },
      }
    : {};
}

module.exports = transactionsDAL;
