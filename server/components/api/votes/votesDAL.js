'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../../server/db/sequelize/models');

const sequelize = db.sequelize;
const votesDAL = dal.createDAL('RepoVote');

votesDAL.findAllUnprocessedCommands = async function(contractId) {
  const sql = tags.oneLine`
    SELECT *
    FROM "Commands" c
    WHERE c."ContractId" = :contractId 
    AND c.id NOT IN 
      (SELECT DISTINCT "CommandId"
      FROM "RepoVotes")
  `;

  return sequelize.query(sql, {
    replacements: {
      contractId,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

module.exports = votesDAL;
