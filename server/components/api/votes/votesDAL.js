'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../../server/db/sequelize/models');

const sequelize = db.sequelize;
const Op = db.Sequelize.Op;
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
/**
 * Find all votes for an interval, grouped by command
 */
votesDAL.findAllByInterval = async function({ interval, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  SELECT "CommandVotes"."commitId",
    "CommandVotes"."zpAmount",
    "CommandVotes"."CommandId",
    "Blocks"."blockNumber",
    "Blocks"."timestamp",
    "Transactions"."hash" AS "txHash"
  FROM "Commands"
  INNER JOIN "Transactions" ON "Commands"."TransactionId" = "Transactions"."id"
  INNER JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
  INNER JOIN (
    SELECT "RepoVote"."CommandId",
      "RepoVote"."commitId",
      (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
    FROM "RepoVotes" AS "RepoVote"
    INNER JOIN "Commands" ON "RepoVote"."CommandId" = "Commands"."id"
    INNER JOIN "Transactions" ON "Commands"."TransactionId" = "Transactions"."id"
    INNER JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
    INNER JOIN "VoteIntervals" 
      ON "RepoVote"."interval" = "VoteIntervals"."interval"
      AND "Blocks"."blockNumber" >= "VoteIntervals"."beginHeight"
      AND "Blocks"."blockNumber" < "VoteIntervals"."endHeight"
    INNER JOIN "Snapshots" 
      ON "RepoVote"."address" = "Snapshots"."address" 
      AND "VoteIntervals"."beginHeight" = "Snapshots"."height"
    WHERE ("RepoVote"."interval" = :interval
            AND "RepoVote"."address" IS NOT NULL) 
    GROUP BY "RepoVote"."CommandId", "RepoVote"."commitId"
  ) AS "CommandVotes"
  ON "Commands"."id" = "CommandVotes"."CommandId"
  ORDER BY "Blocks"."blockNumber" DESC
  LIMIT :limit OFFSET :offset; 
  `;

  return sequelize.query(sql, {
    replacements: {
      interval,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

/**
 * Count all votes for an interval, grouped by command
 */
votesDAL.countByInterval = async function({ interval } = {}) {
  const sql = tags.oneLine`
  SELECT count(*)
  FROM "Commands"
  INNER JOIN (
    SELECT "RepoVote"."CommandId",
      "RepoVote"."commitId",
      (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
    FROM "RepoVotes" AS "RepoVote"
    INNER JOIN "Commands" ON "RepoVote"."CommandId" = "Commands"."id"
    INNER JOIN "Transactions" ON "Commands"."TransactionId" = "Transactions"."id"
    INNER JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
    INNER JOIN "VoteIntervals" 
      ON "RepoVote"."interval" = "VoteIntervals"."interval"
      AND "Blocks"."blockNumber" >= "VoteIntervals"."beginHeight"
      AND "Blocks"."blockNumber" < "VoteIntervals"."endHeight"
    INNER JOIN "Snapshots" 
      ON "RepoVote"."address" = "Snapshots"."address" 
      AND "VoteIntervals"."beginHeight" = "Snapshots"."height"
    WHERE ("RepoVote"."interval" = :interval
            AND "RepoVote"."address" IS NOT NULL) 
    GROUP BY "RepoVote"."CommandId", "RepoVote"."commitId"
  ) AS "CommandVotes"
  ON "Commands"."id" = "CommandVotes"."CommandId"
  `;

  return sequelize.query(sql, {
    replacements: {
      interval,
    },
    type: sequelize.QueryTypes.SELECT,
  }).then(this.queryResultToCount);
};

/**
 * Get the repo vote results for an interval
 * per address, get the vote that was done in the most recent block and most recent tx in it
 *
 * @param {number} interval
 */
votesDAL.getVoteResults = async function(interval) {
  const sql = tags.oneLine`
  SELECT "RepoVotes"."commitId", (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "RepoVotes"
  INNER JOIN "VoteIntervals" ON "RepoVotes"."interval" = "VoteIntervals"."interval"
  INNER JOIN "Snapshots" ON "VoteIntervals"."beginHeight" = "Snapshots"."height" AND "RepoVotes"."address" = "Snapshots"."address"
  INNER JOIN "Commands" ON "Commands".id = "RepoVotes"."CommandId"
  INNER JOIN "Transactions" ON "Transactions".id = "Commands"."TransactionId"
  INNER JOIN "Blocks" ON "Blocks".id = "Transactions"."BlockId"
  INNER JOIN (
  SELECT "RepoVotes"."address",
           max("Blocks"."blockNumber") AS "maxBlock"
      FROM "RepoVotes"
      INNER JOIN "Commands" ON "Commands".id = "RepoVotes"."CommandId"
      INNER JOIN "Transactions" ON "Transactions".id = "Commands"."TransactionId"
      INNER JOIN "Blocks" ON "Blocks".id = "Transactions"."BlockId"
      INNER JOIN "VoteIntervals" 
        ON "RepoVotes"."interval" = "VoteIntervals"."interval"
        AND "Blocks"."blockNumber" >= "VoteIntervals"."beginHeight"
        AND "Blocks"."blockNumber" < "VoteIntervals"."endHeight"
      WHERE "RepoVotes".interval = :interval
      GROUP BY "RepoVotes"."address") AS "FilterByBlock"
  ON "RepoVotes"."address" = "FilterByBlock"."address" AND "Blocks"."blockNumber" = "FilterByBlock"."maxBlock"
  INNER JOIN (
  SELECT "RepoVotes"."address",
           "Blocks"."blockNumber",
           max("Transactions"."index") AS "maxTxIndex"
      FROM "RepoVotes"
      INNER JOIN "Commands" ON "Commands".id = "RepoVotes"."CommandId"
      INNER JOIN "Transactions" ON "Transactions".id = "Commands"."TransactionId"
      INNER JOIN "Blocks" ON "Blocks".id = "Transactions"."BlockId"
      WHERE "RepoVotes".interval = :interval
      GROUP BY "RepoVotes"."address", "Blocks"."blockNumber") AS "FilterByTxIndex"
  ON "RepoVotes"."address" = "FilterByTxIndex"."address" AND "Transactions"."index" = "FilterByTxIndex"."maxTxIndex"
    AND "FilterByBlock"."address" = "FilterByTxIndex"."address" AND "FilterByBlock"."maxBlock" = "FilterByTxIndex"."blockNumber"
  GROUP BY "RepoVotes"."commitId"
  `;

  return sequelize.query(sql, {
    replacements: {
      interval,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

module.exports = votesDAL;
