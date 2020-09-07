'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const deepMerge = require('deepmerge');
const executionsDAL = require('../executions/executionsDAL');
const assetsDAL = require('../assets/assetsDAL');
const AddressUtils = require('../../../../src/common/utils/AddressUtils');

const contractsDAL = dal.createDAL('Contract');
const sequelize = contractsDAL.db.sequelize;
const Op = contractsDAL.db.Sequelize.Op;

const nullsOrderMap = {
  asc: 'NULLS FIRST',
  desc: 'NULLS LAST',
};
// Control what happens when sorting by these parameters
const orderMap = {
  expiryBlock: {
    asc: `${nullsOrderMap.asc}`,
    desc: `${nullsOrderMap.desc}`,
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
    SELECT "Activations"."contractId"
    FROM "Activations"
    JOIN "Txs" ON "Activations"."txId" = "Txs"."id"
    WHERE "Txs"."blockNumber" = :blockNumber
    GROUP BY "Activations"."contractId"
  ) AS "ActivationBlockContracts"
  ON "ActivationBlockContracts"."contractId" = "ContractsFinal"."id"
  `;

  const sql = tags.oneLine`
  WITH "ContractsFinal" AS 
  (SELECT "Contracts".*, COUNT("Assets".asset) AS "assetsCount"
    FROM "Contracts" 
    LEFT JOIN "Assets"
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
      (SELECT "txId", "address"
        FROM "Outputs" 
        WHERE "Outputs"."address" IN (SELECT address FROM "ContractsFinal")
        GROUP BY "txId", "address") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."txId", "Outputs"."address"
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."outputId" = "Outputs"."id" 
        AND "Outputs"."address" IN (SELECT address FROM "ContractsFinal")
        GROUP BY "Inputs"."txId", "Outputs"."address" ) AS "Inputs"
      ON "Outputs"."txId" = "Inputs"."txId" and "Outputs"."address" = "Inputs"."address"
    GROUP BY COALESCE("Outputs"."address", "Inputs"."address")) AS "Txs"
  ON "Txs"."address" = "ContractsFinal"."address"
  LEFT JOIN (
    SELECT MAX("Blocks"."blockNumber") as "blockNumber", "Activations"."contractId"
    FROM "Blocks"
    JOIN "Txs" ON "Txs"."blockNumber" = "Blocks"."blockNumber"
    JOIN "Activations" ON "Activations"."txId" = "Txs"."id"
    GROUP BY "Activations"."contractId"
    ORDER BY "Activations"."contractId", MAX("Blocks"."blockNumber") DESC
  ) AS "LastActivationTransactions"
  ON "LastActivationTransactions"."contractId" = "ContractsFinal"."id"
  ${hasBlockNumber ? filterByBlockSql : ''}
  ORDER BY ${orderBy}
  LIMIT :limit OFFSET :offset
  `;

  let countOptions = {};
  if (hasBlockNumber) {
    countOptions = {
      include: [
        {
          model: this.db.Tx,
          as: 'ActivationTxs',
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
    assetsDAL.count({
      where: {
        asset: {
          [Op.like]: `${id}%`,
        },
      },
    }),
    assetsDAL.findAll({
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

contractsDAL.countExecutions = function(id) {
  return executionsDAL.count({
    where: {
      contractId: id,
    },
  });
};

contractsDAL.getExecutions = function(id, options) {
  return executionsDAL.findAll(
    deepMerge(
      {
        where: {
          contractId: id,
        },
      },
      options
    )
  );
};

contractsDAL.getLastExecutionOfTx = function(id, txHash) {
  return executionsDAL
    .findAll({
      where: {
        contractId: id,
      },
      include: [
        {
          model: this.db.Tx,
          required: true,
          where: {
            hash: txHash,
          },
        },
      ],
      order: [['indexInTx', 'DESC']],
      limit: 1,
    })
    .then(results => {
      return results.length ? results[0] : null;
    });
};

contractsDAL.findExecutionsWithRelations = function(id, options) {
  return Promise.all([
    this.countExecutions(id),
    this.getExecutions(
      id,
      deepMerge(
        {
          include: [
            {
              model: this.db.Tx,
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
            [{ model: this.db.Tx }, { model: this.db.Block }, 'timestamp', 'DESC'],
            ['indexInTx', 'ASC'],
          ],
        },
        options
      )
    ),
  ]).then(this.getItemsAndCountResult);
};

contractsDAL.deleteExecutions = function(id) {
  return this.db.Execution.destroy({
    where: {
      contractId: id,
    },
  });
};

contractsDAL.getActivationTxs = function(contract) {
  return contract.getActivationTxs({
    order: [[sequelize.col('Block.blockNumber'), 'DESC']],
    include: [
      {
        model: this.db.Block,
        required: true,
      },
    ],
  });
};
contractsDAL.getLastActivationTx = function(contract) {
  return contract
    .getActivationTxs({
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

contractsDAL.addActivationTx = async function(contract, transaction, options) {
  if (contract && transaction) {
    return contract.addActivationTx(transaction, options);
  }
  return null;
};

module.exports = contractsDAL;
