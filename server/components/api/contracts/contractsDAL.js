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
  lastActivationBlock: nullsOrderMap,
};

/**
 * Parses a sequelize order array into plain sql and maps attributes if needed
 */
function getSqlOrderBy(order = []) {
  return order
    .map(
      (item) =>
        `"${item[0]}" ${item[1]} ${
          Object.keys(orderMap).includes(item[0]) ? orderMap[item[0]][item[1].toLowerCase()] : ''
        }`
    )
    .join(', ');
}

contractsDAL.findAllWithAssetsCountTxCountAndCountOrderByNewest = function ({
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
  ON "ActivationBlockContracts"."contractId" = c.id
  `;

  const sql = tags.oneLine`
  SELECT 
    c.*
  FROM "Contracts" c
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
          where: {
            blockNumber,
          },
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

contractsDAL.findByAddress = function (address, options) {
  return this.findOne({
    where: {
      address,
    },
    ...options,
  });
};

contractsDAL.search = async function (search, limit = 10) {
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

contractsDAL.findAllActive = function () {
  return this.findAll({
    where: {
      expiryBlock: {
        [Op.ne]: null,
      },
    },
  });
};

contractsDAL.findAllExpired = function () {
  return this.findAll({
    where: {
      expiryBlock: null,
    },
  });
};

contractsDAL.findAllOutstandingAssets = function (id, { limit = 10, offset = 0 } = {}) {
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

contractsDAL.setExpired = function (ids = []) {
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

contractsDAL.countExecutions = function (id) {
  return executionsDAL.count({
    where: {
      contractId: id,
    },
  });
};

contractsDAL.getExecutions = function (id, options) {
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

contractsDAL.getLastExecutionOfTx = function (id, txHash) {
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
    .then((results) => {
      return results.length ? results[0] : null;
    });
};

contractsDAL.findExecutions = function (id, { limit, offset } = {}) {
  return Promise.all([
    executionsDAL.count({ where: { contractId: id } }),
    sequelize.query(
      tags.oneLine`
        SELECT "Executions".*, "Txs"."hash" AS "txHash", "Blocks"."timestamp" AS "timestamp"
        FROM "Executions"
        INNER JOIN "Txs" ON "Executions"."txId" = "Txs"."id"
        INNER JOIN "Blocks" ON "Executions"."blockNumber" = "Blocks"."blockNumber"
        WHERE "Executions"."contractId" = :contractId
        ORDER BY "Executions"."blockNumber" DESC, "Executions"."indexInTx" DESC
        ${limit ? 'LIMIT :limit' : ''} ${offset ? 'OFFSET :offset' : ''}
    `,
      {
        replacements: {
          limit,
          offset,
          contractId: id,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ),
  ]).then(this.getItemsAndCountResult);
};

contractsDAL.deleteExecutions = function (id) {
  return this.db.Execution.destroy({
    where: {
      contractId: id,
    },
  });
};

contractsDAL.getActivationTxs = function (contract) {
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
contractsDAL.getLastActivationTx = function (contract) {
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
    .then((results) => (results.length ? results[0] : null));
};

contractsDAL.addActivationTx = async function (contract, transaction, options) {
  if (contract && transaction) {
    return contract.addActivationTx(transaction, options);
  }
  return null;
};

module.exports = contractsDAL;
