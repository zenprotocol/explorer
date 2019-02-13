'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const deepMerge = require('deepmerge');
const commandsDAL = require('../commands/commandsDAL');
const assetOutstandingsDAL = require('../assetOutstandings/assetOutstandingsDAL');
const AddressUtils = require('../../../../src/common/utils/AddressUtils');

const contractsDAL = dal.createDAL('Contract');
const sequelize = contractsDAL.db.sequelize;
const Op = sequelize.Op;

const nullsOrderMap = {
  asc: 'NULLS FIRST',
  desc: 'NULLS LAST',
};
// Control what happens when sorting by these parameters
const orderMap = {
  expiryBlock: {
    asc: `${nullsOrderMap.asc}, "createdAt" ASC`,
    desc: `${nullsOrderMap.desc}, "createdAt" DESC`,
  },
  lastActivationBlockNumber: nullsOrderMap,
};

/**
 * Parses a sequelize order array into plain sql and maps attributes if needed
 */
function getSqlOrderBy(order = []) {
  return order
    .map(
      item =>
        `"${item[0]}" ${item[1]} ${
          Object.keys(orderMap).includes(item[0]) ? orderMap[item[0]][item[1].toLowerCase()] : ''
        }`
    )
    .join(', ');
}

contractsDAL.findAllWithAssetsCountTxCountAndCountOrderByNewest = function({
  limit = 10,
  offset = 0,
  order = [],
  blockNumber,
} = {}) {
  const hasBlockNumber = blockNumber && !isNaN(Number(blockNumber));
  const orderBy = getSqlOrderBy(order);

  const filterByBlockSql = `
  INNER JOIN (
    SELECT "ContractActivations"."ContractId"
    FROM "Blocks"
    JOIN "Transactions" ON "Transactions"."BlockId" = "Blocks"."id"
    JOIN "ContractActivations" ON "ContractActivations"."TransactionId" = "Transactions"."id"
    WHERE "Blocks"."blockNumber" = :blockNumber
    GROUP BY "ContractActivations"."ContractId"
  ) AS "ActivationBlockContracts"
  ON "ActivationBlockContracts"."ContractId" = "ContractsFinal"."id"
  `;

  const sql = tags.oneLine`
  WITH "ContractsFinal" AS 
  (SELECT "Contracts".*, COUNT("Assets".asset) AS "assetsCount"
    FROM "Contracts" 
    LEFT JOIN 
      (SELECT asset
      FROM "AssetOutstandings") AS "Assets"
    ON "Assets"."asset" LIKE CONCAT("Contracts"."id", '%')
    GROUP BY "Contracts"."id" 
    LIMIT (SELECT COUNT(*) FROM "Contracts"))

  SELECT 
    "ContractsFinal"."id",
    "ContractsFinal"."address",
    "ContractsFinal"."expiryBlock",
    "ContractsFinal"."assetsCount",
    COALESCE("Txs"."total", 0) AS "transactionsCount",
    "LastActivationTransactions"."blockNumber" AS "lastActivationBlockNumber"
  FROM "ContractsFinal"
  LEFT JOIN
  (SELECT 
    COUNT(*) AS "total",
    COALESCE("Outputs"."address", "Inputs"."address") AS "address"
    FROM
      (SELECT "TransactionId", "address"
        FROM "Outputs" 
        WHERE "Outputs"."address" IN (SELECT address FROM "ContractsFinal")
        GROUP BY "TransactionId", "address") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."TransactionId", "Outputs"."address"
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."OutputId" = "Outputs"."id" 
        AND "Outputs"."address" IN (SELECT address FROM "ContractsFinal")
        GROUP BY "Inputs"."TransactionId", "Outputs"."address" ) AS "Inputs"
      ON "Outputs"."TransactionId" = "Inputs"."TransactionId" and "Outputs"."address" = "Inputs"."address"
    GROUP BY COALESCE("Outputs"."address", "Inputs"."address")) AS "Txs"
  ON "Txs"."address" = "ContractsFinal"."address"
  LEFT JOIN (
    SELECT MAX("Blocks"."blockNumber") as "blockNumber", "ContractActivations"."ContractId"
    FROM "Blocks"
    JOIN "Transactions" ON "Transactions"."BlockId" = "Blocks"."id"
    JOIN "ContractActivations" ON "ContractActivations"."TransactionId" = "Transactions"."id"
    GROUP BY "ContractActivations"."ContractId"
    ORDER BY "ContractActivations"."ContractId", MAX("Blocks"."blockNumber") DESC
  ) AS "LastActivationTransactions"
  ON "LastActivationTransactions"."ContractId" = "ContractsFinal"."id"
  ${hasBlockNumber ? filterByBlockSql : ''}
  ORDER BY ${orderBy}
  LIMIT :limit OFFSET :offset
  `;

  let countOptions = {};
  if (hasBlockNumber) {
    countOptions = {
      include: [
        {
          model: this.db.Transaction,
          as: 'ActivationTransactions',
          required: true,
          include: [
            {
              model: this.db.Block,
              required: true,
              where: {
                blockNumber,
              },
            },
          ],
        },
      ],
    };
  }
  return Promise.all([
    this.count(countOptions),
    sequelize.query(sql, {
      replacements: {
        limit,
        offset,
        blockNumber,
      },
      type: sequelize.QueryTypes.SELECT,
    }),
  ]).then(this.getItemsAndCountResult);
};

contractsDAL.findByAddress = function(address) {
  return this.findOne({
    where: {
      address,
    },
  });
};

contractsDAL.search = async function(search, limit = 10) {
  const like = AddressUtils.isContract(search) ? `${search}%` : `%${search}%`;
  const where = {
    address: {
      [Op.like]: like,
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

contractsDAL.findAllActive = function() {
  return this.findAll({
    where: {
      expiryBlock: {
        [Op.ne]: null,
      },
    },
  });
};

contractsDAL.findAllExpired = function() {
  return this.findAll({
    where: {
      expiryBlock: null,
    },
  });
};

contractsDAL.findAllOutstandingAssets = function(id, { limit = 10, offset = 0 } = {}) {
  return Promise.all([
    assetOutstandingsDAL.count({
      where: {
        asset: {
          [Op.like]: `${id}%`,
        },
      },
    }),
    assetOutstandingsDAL.findAll({
      where: {
        asset: {
          [Op.like]: `${id}%`,
        },
      },
      limit,
      offset,
    }),
  ]).then(this.getItemsAndCountResult);
};

contractsDAL.setExpired = function(ids = []) {
  if (!ids.length) {
    return Promise.resolve();
  }

  return this.db[this.model].update(
    {
      expiryBlock: null,
    },
    {
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    }
  );
};

contractsDAL.countCommands = function(id) {
  return commandsDAL.count({
    where: {
      ContractId: id,
    },
  });
};

contractsDAL.getCommands = function(id, options) {
  return commandsDAL.findAll(
    deepMerge(
      {
        where: {
          ContractId: id,
        },
      },
      options
    )
  );
};

contractsDAL.getLastCommandOfTx = function(id, txHash) {
  return commandsDAL
    .findAll({
      where: {
        ContractId: id,
      },
      include: [
        {
          model: this.db.Transaction,
          required: true,
          where: {
            hash: txHash,
          },
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 1,
    })
    .then(results => {
      return results.length ? results[0] : null;
    });
};

contractsDAL.findCommandsWithRelations = function(id, options) {
  return Promise.all([
    this.countCommands(id),
    this.getCommands(
      id,
      deepMerge(
        {
          include: [
            {
              model: this.db.Transaction,
              required: true,
              include: [
                {
                  model: this.db.Block,
                  required: true,
                },
              ],
            },
          ],
          order: [
            [{ model: this.db.Transaction }, { model: this.db.Block }, 'timestamp', 'DESC'],
            ['indexInTransaction', 'ASC'],
          ],
        },
        options
      )
    ),
  ]).then(this.getItemsAndCountResult);
};

contractsDAL.deleteCommands = function(id) {
  return this.db.Command.destroy({
    where: {
      ContractId: id,
    },
  });
};

contractsDAL.getActivationTransactions = function(contract) {
  return contract.getActivationTransactions({
    order: [[sequelize.col('Block.blockNumber'), 'DESC']],
    include: [
      {
        model: this.db.Block,
        required: true,
      },
    ],
  });
};
contractsDAL.getLastActivationTransaction = function(contract) {
  return contract
    .getActivationTransactions({
      order: [[sequelize.col('Block.blockNumber'), 'DESC']],
      limit: 1,
      include: [
        {
          model: this.db.Block,
          required: true,
        },
      ],
    })
    .then(results => (results.length ? results[0] : null));
};

contractsDAL.addActivationTransaction = async function(contract, transaction, options) {
  if (contract && transaction) {
    return contract.addActivationTransaction(transaction, options);
  }
  return null;
};

module.exports = contractsDAL;
