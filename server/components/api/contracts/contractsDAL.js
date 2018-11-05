'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const deepMerge = require('deepmerge');
const Op = require('sequelize').Op;
const inputsDAL = require('../inputs/inputsDAL');
const commandsDAL = require('../commands/commandsDAL');

const contractsDAL = dal.createDAL('Contract');

contractsDAL.findByAddress = function(address) {
  return this.findOne({
    where: {
      address,
    },
  });
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
  const sequelize = contractsDAL.db.sequelize;
  const sql = tags.oneLine`
  SELECT
    COALESCE("Issued"."asset", "Destroyed"."asset") AS "asset",
    "Issued"."sum" AS "issued",
    "Destroyed"."sum" AS "destroyed",
    COALESCE("Issued"."sum", 0) -  COALESCE("Destroyed"."sum", 0) AS "outstanding",
    "Keyholders"."total" AS "keyholders"
  FROM
    (SELECT asset, SUM("amount") AS sum
    FROM "Inputs"
    WHERE "Inputs"."asset" LIKE :assetSearch
      AND "Inputs"."isMint" = 'true'
    GROUP BY "Inputs"."asset") AS "Issued"
    LEFT JOIN
    (SELECT asset, SUM("amount") AS sum
    FROM "Outputs"
    WHERE "Outputs"."asset" LIKE :assetSearch
      AND "Outputs"."lockType" = 'Destroy'
    GROUP BY "Outputs"."asset") AS "Destroyed"
    ON "Issued"."asset" = "Destroyed"."asset" 
    LEFT JOIN
    (SELECT COUNT("UniqueAddresses"."address") AS "total", "UniqueAddresses"."asset"
    FROM
      (SELECT "address", "asset"
      FROM "Outputs"
      WHERE "Outputs"."asset" LIKE :assetSearch
      GROUP BY "Outputs"."asset", "Outputs"."address") AS "UniqueAddresses"
    GROUP BY "UniqueAddresses"."asset") AS "Keyholders"
    ON "Issued"."asset" = "Keyholders"."asset"
    LIMIT :limit OFFSET :offset
  `;

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
    sequelize.query(sql, {
      replacements: {
        assetSearch: `${id}%`,
        limit,
        offset,
      },
      type: sequelize.QueryTypes.SELECT,
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
