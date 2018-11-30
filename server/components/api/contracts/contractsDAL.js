'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const deepMerge = require('deepmerge');
const inputsDAL = require('../inputs/inputsDAL');
const commandsDAL = require('../commands/commandsDAL');
const assetOutstandingsDAL = require('../assetOutstandings/assetOutstandingsDAL');
const AddressUtils = require('../../../../src/common/utils/AddressUtils');

const contractsDAL = dal.createDAL('Contract');
const sequelize = contractsDAL.db.sequelize;
const Op = sequelize.Op;

contractsDAL.findAllWithAssetsCountTxCountAndCountOrderByNewest = function({ limit = 10, offset = 0 } = {}) {
  const sql = tags.oneLine`
  WITH "ContractsFinal" AS 
  (SELECT "Contracts".*, COUNT("Assets".asset) AS "assetsCount"
    FROM "Contracts" 
    LEFT JOIN 
      (SELECT asset
      FROM "AssetOutstandings") AS "Assets"
    ON "Assets"."asset" LIKE CONCAT("Contracts"."id", '%')
    GROUP BY "Contracts"."id"
    ORDER BY "expiryBlock" DESC NULLS LAST, "updatedAt" DESC
    LIMIT :limit OFFSET :offset)

  SELECT 
    "ContractsFinal".*,
    COALESCE("Txs"."total", 0) AS "transactionsCount"
  FROM "ContractsFinal"
  LEFT JOIN
  (SELECT 
    COUNT(*) AS "total",
    COALESCE("Outputs"."address", "Inputs"."address") AS "address"
    FROM
      (SELECT "TransactionId", "address"
        FROM "Outputs" 
        WHERE "Outputs"."address" IN (SELECT ADDRESS FROM "ContractsFinal")
        GROUP BY "TransactionId", "address") AS "Outputs"
      FULL OUTER JOIN (SELECT "Inputs"."TransactionId", "Outputs"."address"
        FROM "Inputs" JOIN "Outputs" 
        ON "Inputs"."OutputId" = "Outputs"."id" 
        AND "Outputs"."address" IN (SELECT ADDRESS FROM "ContractsFinal")
        GROUP BY "Inputs"."TransactionId", "Outputs"."address" ) AS "Inputs"
      ON "Outputs"."TransactionId" = "Inputs"."TransactionId" and "Outputs"."address" = "Inputs"."address"
    GROUP BY COALESCE("Outputs"."address", "Inputs"."address")) AS "Txs"
  ON "Txs"."address" = "ContractsFinal"."address"
  `;
  return Promise.all([
    this.count(),
    sequelize.query(sql, {
      replacements: {
        limit,
        offset,
      },
      type: sequelize.QueryTypes.SELECT,
    })
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
    inputsDAL.count({
      col: 'asset',
      where: {
        asset: {
          [Op.like]: `${id}%`,
        },
        isMint: true,
      },
      distinct: true,
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

module.exports = contractsDAL;
