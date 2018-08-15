'use strict';

const deepMerge = require('deepmerge');
const dal = require('../../../lib/dal');
const transactionsDAL = dal.createDAL('Transaction');
const addressesDAL = require('../addresses/addressesDAL');
const blocksDAL = require('../blocks/blocksDAL');
const getFieldsForSelectQuery = require('../../../lib/getFieldsForSelectQuery');

transactionsDAL.findByHash = async function(hash) {
  return transactionsDAL.findOne({
    where: {
      hash,
    },
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
    order: [[transactionsDAL.db.Input, 'index'], [transactionsDAL.db.Output, 'index']],
  });
};

transactionsDAL.findAllByAddress = async function(
  address,
  firstTransactionId,
  ascending,
  options = { limit: 10 }
) {
  const addressDB = await addressesDAL.findByAddress(address);
  if (!addressDB) return Promise.resolve([]);

  const whereOption = getFirstTransactionIdWhereOption(firstTransactionId, ascending);
  const finalOptions = deepMerge.all([
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
      where: whereOption,
      order: [[this.db.Input, 'index'], [this.db.Output, 'index']],
    },
  ]);
  // deepMerge makes symbols disappear!
  if (whereOption.id) {
    finalOptions.where.id = whereOption.id;
  }
  return addressDB.getTransactions(finalOptions);
};

transactionsDAL.findAllAssetsByAddress = async function(address, { limit = 10, offset = 0 }) {
  const sequelize = transactionsDAL.db.sequelize;
  const sql = `
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
      INNER JOIN "Transactions" AS "Transaction" ON "OutputAsset"."TransactionId" = "Transaction"."id"
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

transactionsDAL.findAllAssetsByBlockNumber = async function(blockNumber, { limit = 10, offset = 0 }) {
  const sequelize = transactionsDAL.db.sequelize;
  const sql = `
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
      JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id" AND "Blocks"."blockNumber" = :blockNumber
    GROUP BY "Output"."TransactionId", "Output"."asset") AS "OutputAsset"

    FULL OUTER JOIN

    (SELECT SUM("Output"."amount") AS "inputSum",
      "Output"."asset",
      "Input"."TransactionId"
    FROM "Inputs" AS "Input"
      INNER JOIN "Outputs" as "Output" ON "Input"."OutputId" = "Output"."id"
      JOIN "Transactions" ON "Input"."TransactionId" = "Transactions"."id"
      JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id" AND "Blocks"."blockNumber" = :blockNumber
    GROUP BY "Input"."TransactionId", "Output"."asset") AS "InputAsset"

    ON "OutputAsset"."TransactionId" = "InputAsset"."TransactionId"
      AND "OutputAsset"."asset" = "InputAsset"."asset"
    INNER JOIN "Transactions" AS "Transaction" ON "OutputAsset"."TransactionId" = "Transaction"."id"
    INNER JOIN "Blocks" AS "Block" ON "Transaction"."BlockId" = "Block"."id"
  WHERE "Block"."blockNumber" = :blockNumber
  LIMIT :limit OFFSET :offset`;

  return sequelize.query(sql, {
    replacements: {
      blockNumber,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

transactionsDAL.countByAddress = async function(address, firstTransactionId, ascending) {
  const whereOption = getFirstTransactionIdWhereOption(firstTransactionId, ascending);
  return this.count({
    where: whereOption,
    include: [
      {
        model: this.db.Address,
        where: {
          address,
        },
      },
    ],
  });
};

transactionsDAL.countAssetsByAddress = async function(address) {
  const sequelize = transactionsDAL.db.sequelize;
  const sql = `
  SELECT COUNT("OutputAsset"."TransactionId")
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

transactionsDAL.countAssetsByBlockNumber = async function(blockNumber) {
  const sequelize = transactionsDAL.db.sequelize;
  const sql = `
  SELECT
    COUNT("Transaction"."id")
  FROM
    (SELECT SUM("Output"."amount") AS "outputSum",
      "Output"."asset",
      "Output"."TransactionId"
    FROM "Outputs" AS "Output"
      JOIN "Transactions" ON "Output"."TransactionId" = "Transactions"."id"
      JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id" AND "Blocks"."blockNumber" = :blockNumber
    GROUP BY "Output"."TransactionId", "Output"."asset") AS "OutputAsset"

    FULL OUTER JOIN

    (SELECT SUM("Output"."amount") AS "inputSum",
      "Output"."asset",
      "Input"."TransactionId"
    FROM "Inputs" AS "Input"
      INNER JOIN "Outputs" as "Output" ON "Input"."OutputId" = "Output"."id"
      JOIN "Transactions" ON "Input"."TransactionId" = "Transactions"."id"
      JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id" AND "Blocks"."blockNumber" = :blockNumber
    GROUP BY "Input"."TransactionId", "Output"."asset") AS "InputAsset"

    ON "OutputAsset"."TransactionId" = "InputAsset"."TransactionId"
      AND "OutputAsset"."asset" = "InputAsset"."asset"
    INNER JOIN "Transactions" AS "Transaction" ON "OutputAsset"."TransactionId" = "Transaction"."id"
    INNER JOIN "Blocks" AS "Block" ON "Transaction"."BlockId" = "Block"."id"
  WHERE "Block"."blockNumber" = :blockNumber`;

  return sequelize
    .query(sql, {
      replacements: {
        blockNumber,
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

transactionsDAL.findTransactionAssetInputsOutputs = async function(id, asset) {
  const sequelize = this.db.sequelize;
  // console.log(this.db.Block.rawAttributes);
  
  return this.findOne({
    where: {
      id
    },
    include: [
      {
        model: this.db.Block
      },
      {
        model: this.db.Output,
        where: {
          asset
        },
      },
      {
        model: this.db.Input,
        include: [
          {
            model: this.db.Output,
            where: {
              asset
            }
          }
        ]
      }
    ],
  });

  

//   const sql = `
//   SELECT
//     ${getFieldsForSelectQuery(this.db.Transaction, 'Transaction', true)},
//     CASE WHEN "Transaction"."index" = 0 THEN true
//           ELSE false
//           END AS "isCoinbaseTx",
//     COALESCE("Sums"."outputSum", 0) AS "outputSum",
//     COALESCE("Sums"."inputSum", 0) AS "inputSum",
//     COALESCE("inputSum", 0) - COALESCE("outputSum", 0) AS "totalSum",
//     ${getFieldsForSelectQuery(this.db.Block, 'Block')},
//     ${getFieldsForSelectQuery(this.db.Output, 'Outputs')},
//     "Inputs"."id" AS "Inputs.id",
//     "Inputs"."index" AS "Inputs.index",
//     "Inputs"."outpointTXHash" AS "Inputs.outpointTXHash",
//     "Inputs"."outpointIndex" AS "Inputs.outpointIndex",
//     "Inputs"."amount" AS "Inputs.amount",
//     "Inputs"."createdAt" AS "Inputs.createdAt",
//     "Inputs"."updatedAt" AS "Inputs.updatedAt",
//     "Inputs"."TransactionId" AS "Inputs.TransactionId",
//     "Inputs"."OutputId" AS "Inputs.OutputId",
//     "Inputs->Output"."id" AS "Inputs.Output.id",
//     "Inputs->Output"."lockType" AS "Inputs.Output.lockType",
//     "Inputs->Output"."contractLockVersion" AS "Inputs.Output.contractLockVersion",
//     "Inputs->Output"."address" AS "Inputs.Output.address",
//     "Inputs->Output"."addressBC" AS "Inputs.Output.addressBC",
//     "Inputs->Output"."asset" AS "Inputs.Output.asset",
//     "Inputs->Output"."amount" AS "Inputs.Output.amount",
//     "Inputs->Output"."index" AS "Inputs.Output.index",
//     "Inputs->Output"."createdAt" AS "Inputs.Output.createdAt",
//     "Inputs->Output"."updatedAt" AS "Inputs.Output.updatedAt",
//     "Inputs->Output"."TransactionId" AS "Inputs.Output.TransactionId"
//   FROM
//     "Transactions" AS "Transaction"
//     LEFT OUTER JOIN "Blocks" AS "Block" ON "Transaction"."BlockId" = "Block"."id"
//     LEFT OUTER JOIN "Outputs" AS "Outputs" ON "Outputs"."TransactionId" = "Transaction"."id"
//     LEFT OUTER JOIN ("Inputs" AS "Inputs"
//     INNER JOIN "Outputs" AS "Inputs->Output" ON "Inputs"."OutputId" = "Inputs->Output"."id")
//     ON "Transaction"."id" = "Inputs"."TransactionId"
//     LEFT OUTER JOIN
//     ( 
//     SELECT "outputSum", "inputSum", COALESCE("OutputAsset"."TransactionId", "InputAsset"."TransactionId") AS "TransactionId"
//     FROM
//       (SELECT SUM("Output"."amount") AS "outputSum",
//         "Output"."TransactionId"
//       FROM "Outputs" AS "Output"
//       -- WHERE "Output"."address" = 'zen1qsap3rkrvl6ckfj0nsztxalcfh9gsuzt5ndcgh9nq03tx9ygxdsvshgeter'
//       WHERE "Output"."asset" = :asset AND "Output"."TransactionId" = :id
//       GROUP BY "Output"."TransactionId", "Output"."asset") AS "OutputAsset"

//       FULL OUTER JOIN

//       (SELECT SUM("Output"."amount") AS "inputSum",
//         "Input"."TransactionId"
//       FROM "Inputs" AS "Input"
//         INNER JOIN "Outputs" as "Output" ON "Input"."OutputId" = "Output"."id"
//       -- WHERE "address" = 'zen1qsap3rkrvl6ckfj0nsztxalcfh9gsuzt5ndcgh9nq03tx9ygxdsvshgeter'
//       WHERE "Output"."asset" = :asset AND "Input"."TransactionId" = :id
//       GROUP BY "Input"."TransactionId", "Output"."asset") AS "InputAsset"

//       ON "OutputAsset"."TransactionId" = "InputAsset"."TransactionId"
//     ) AS "Sums"
//     ON "Sums"."TransactionId" = "Transaction"."id"

//   WHERE "Transaction"."id" = :id
// `;
//   return sequelize.query(sql, {
//     replacements: {
//       id,
//       asset
//     },
//     type: sequelize.QueryTypes.SELECT,
//     nest: true,
//   });
};

transactionsDAL.addInput = async function(transaction, input, options = {}) {
  return transaction.addInput(input, options);
};
transactionsDAL.addInput = transactionsDAL.addInput.bind(transactionsDAL);

transactionsDAL.addOutput = async function(transaction, output, options = {}) {
  return transaction.addOutput(output, options);
};
transactionsDAL.addOutput = transactionsDAL.addOutput.bind(transactionsDAL);

/**
 * Add an address to a transaction
 *
 * @param {Object} transaction
 * @param {Object|string} address
 * @param {Object} [options={}]
 */
transactionsDAL.addAddress = async function(transaction, address, addressBC, options = {}) {
  let addressDB = null;
  if (typeof address === 'string') {
    addressDB = await addressesDAL.findByAddress(address, options);
    if (!addressDB) {
      addressDB = await addressesDAL.create({ address, addressBC }, options);
    }
  } else {
    addressDB = address;
  }
  return transaction.addAddress(addressDB, options);
};

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
