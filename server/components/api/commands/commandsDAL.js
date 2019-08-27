'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');

const sequelize = db.sequelize;
const commandsDAL = dal.createDAL('Command');

commandsDAL.getCommandBlockNumber = async function(command) {
  const sql = tags.oneLine`
  SELECT
    "Blocks"."blockNumber"
  FROM
    "Commands"
    INNER JOIN "Transactions" ON "Commands"."TransactionId" = "Transactions"."id"
    INNER JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
  WHERE
    "Commands"."id" = :id
  `;

  return sequelize
    .query(sql, {
      replacements: {
        id: command.id,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(results => (results.length ? results[0].blockNumber : null));
};

module.exports = commandsDAL;
