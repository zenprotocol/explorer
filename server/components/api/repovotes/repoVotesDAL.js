'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');

const sequelize = db.sequelize;
const Op = db.Sequelize.Op;
const votesDAL = dal.createDAL('RepoVote');

/**
 * Get all executions which are not yet added to repo votes
 * order then by block number and transaction
 */
votesDAL.findAllUnprocessedExecutions = async function (contractId) {
  const sql = tags.oneLine`
    SELECT e.*
    FROM "Executions" e
    JOIN "Txs" t ON e."txId" = t.id
    WHERE e."contractId" = :contractId 
    AND e.id NOT IN 
      (SELECT DISTINCT "executionId"
      FROM "RepoVotes")
    ORDER BY e."blockNumber" ASC, t.index ASC
  `;

  return sequelize.query(sql, {
    replacements: {
      contractId,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

votesDAL.findAllInIntervalByAddress = async function ({
  address,
  beginBlock,
  endBlock,
  ...options
} = {}) {
  return this.findAll({
    where: {
      address,
      blockNumber: {
        [Op.gt]: beginBlock,
        [Op.lte]: endBlock,
      },
    },
    ...options,
  });
};
/**
 * Find all votes for an interval, grouped by execution
 */
votesDAL.findAllByInterval = async function ({ beginBlock, endBlock, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  SELECT "RepoVotes"."commitId",
    sum("Snapshots"."amount") as "amount",
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount",
    "RepoVotes"."blockNumber",
    "RepoVotes"."txHash",
    "Blocks"."timestamp"
  FROM "RepoVotes"
  INNER JOIN "Blocks" ON "Blocks"."blockNumber" = "RepoVotes"."blockNumber"
  INNER JOIN "Snapshots" 
    ON "Snapshots"."blockNumber"  = :beginBlock
    AND "Snapshots"."address" = "RepoVotes"."address"
  WHERE "RepoVotes"."address" IS NOT NULL
    AND "RepoVotes"."blockNumber" > :beginBlock
    AND "RepoVotes"."blockNumber" <= :endBlock
  GROUP BY "RepoVotes"."executionId", 
    "RepoVotes"."commitId", 
    "RepoVotes"."blockNumber", 
    "RepoVotes"."txHash", 
    "Blocks"."timestamp"
  ORDER BY "RepoVotes"."blockNumber" DESC
  LIMIT :limit OFFSET :offset; 
  `;

  return sequelize.query(sql, {
    replacements: {
      beginBlock,
      endBlock,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

/**
 * Count all votes for an interval, grouped by execution
 */
votesDAL.countByInterval = async function ({ beginBlock, endBlock } = {}) {
  const sql = tags.oneLine`
  SELECT count(*) FROM (
    SELECT "RepoVotes"."commitId"
    FROM "RepoVotes"
    INNER JOIN "Snapshots" 
      ON "Snapshots"."blockNumber"  = :beginBlock
      AND "Snapshots"."address" = "RepoVotes"."address"
    WHERE "RepoVotes"."address" IS NOT NULL
      AND "RepoVotes"."blockNumber" > :beginBlock
      AND "RepoVotes"."blockNumber" <= :endBlock
    GROUP BY "RepoVotes"."executionId", "RepoVotes"."commitId"
  ) AS "Votes";
  `;

  return sequelize
    .query(sql, {
      replacements: {
        beginBlock,
        endBlock,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

/**
 * Get the repo vote results for an interval
 * per address, get the vote that was done in the earliest block and earliest tx in it
 *
 * @param {number} interval
 */
votesDAL.findAllVoteResults = async function ({ beginBlock, endBlock, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  SELECT "RepoVotes"."commitId", 
    sum("Snapshots"."amount") as "amount", 
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "RepoVotes"
  INNER JOIN "Snapshots" 
    ON "Snapshots"."blockNumber" = :beginBlock
    AND "Snapshots"."address" = "RepoVotes"."address"
  WHERE "RepoVotes"."blockNumber" > :beginBlock
    AND "RepoVotes"."blockNumber" <= :endBlock
  GROUP BY "RepoVotes"."commitId"
  ORDER BY "zpAmount" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      beginBlock,
      endBlock,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

votesDAL.countAllVoteResults = async function ({ beginBlock, endBlock } = {}) {
  const sql = tags.oneLine`
  SELECT count(*) FROM (
    SELECT "RepoVotes"."commitId"
    FROM "RepoVotes"
    INNER JOIN "Snapshots" 
      ON "Snapshots"."blockNumber" = :beginBlock
      AND "Snapshots"."address" = "RepoVotes"."address"
    WHERE "RepoVotes"."blockNumber" > :beginBlock
      AND "RepoVotes"."blockNumber" <= :endBlock
    GROUP BY "RepoVotes"."commitId"
  ) AS "Results"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        beginBlock,
        endBlock,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

/**
 * Find the vote results which passed the threshold
 * @param {Object} params
 * @param {number} beginBlock - the begin block of the contestant phase
 * @param {number} endBlock - the end block of the contestant phase
 * @param {string} threshold - the threshold in kalapas
 */
votesDAL.findContestantWinners = async function ({
  beginBlock,
  endBlock,
  threshold,
  transaction,
} = {}) {
  const sql = tags.oneLine`
  SELECT "commitId", "amount", "zpAmount" FROM (
    SELECT "RepoVotes"."commitId", 
      sum("Snapshots"."amount") AS "amount", 
      (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
    FROM "RepoVotes"
    INNER JOIN "Snapshots" 
      ON "Snapshots"."blockNumber" = :beginBlock
      AND "Snapshots"."address" = "RepoVotes"."address"
    WHERE "RepoVotes"."blockNumber" > :beginBlock
      AND "RepoVotes"."blockNumber" <= :endBlock
    GROUP BY "RepoVotes"."commitId"
  ) AS "Results"
  WHERE "amount" >= :threshold
  ORDER BY "zpAmount" DESC
  `;

  return sequelize.query(sql, {
    replacements: {
      beginBlock,
      endBlock,
      threshold,
    },
    type: sequelize.QueryTypes.SELECT,
    transaction,
  });
};

/**
 * The winner is the vote result with the highest amount, no need to use the threshold
 * handles TIE
 * 
 * @returns {{commitId: string, amount: string, zpAmount: string}}
 */
votesDAL.findCandidateWinner = async function ({ beginBlock, endBlock } = {}) {
  const sql = tags.oneLine`
  SELECT "RepoVotes"."commitId", 
    sum("Snapshots"."amount") as "amount", 
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "RepoVotes"
  INNER JOIN "Snapshots" 
    ON "Snapshots"."blockNumber" = :beginBlock
    AND "Snapshots"."address" = "RepoVotes"."address"
  WHERE "RepoVotes"."blockNumber" > :beginBlock
    AND "RepoVotes"."blockNumber" <= :endBlock
  GROUP BY "RepoVotes"."commitId"
  ORDER BY "zpAmount" DESC
  LIMIT 2; 
  `;

  return sequelize
    .query(sql, {
      replacements: {
        beginBlock,
        endBlock,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then((results) => {
      if (!results.length) {
        return null;
      }

      // TIE
      if (results.length === 2 && results[0].amount === results[1].amount) {
        return null;
      }

      return results[0];
    });
};

votesDAL.findZpParticipated = async function ({ beginBlock, endBlock } = {}) {
  const sql = tags.oneLine`
  SELECT sum("Snapshots"."amount") AS "amount"
  FROM "RepoVotes"
  INNER JOIN "Snapshots" 
    ON "Snapshots"."blockNumber" = :beginBlock
    AND "Snapshots"."address" = "RepoVotes"."address"
  WHERE "RepoVotes"."blockNumber" > :beginBlock
    AND "RepoVotes"."blockNumber" <= :endBlock
  `;

  return sequelize
    .query(sql, {
      replacements: {
        beginBlock,
        endBlock,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then((result) => (result.length && result[0].amount ? result[0].amount : '0'));
};

module.exports = votesDAL;
