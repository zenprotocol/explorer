'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');

const sequelize = db.sequelize;
const Op = db.Sequelize.Op;
const cgpDAL = dal.createDAL('CgpVote');

cgpDAL.findAllUnprocessedExecutions = async function (contractId) {
  const sql = tags.oneLine`
    SELECT "Executions".*
    FROM "Executions"
    INNER JOIN "Txs" ON "Executions"."txId" = "Txs"."id"
    WHERE "Executions"."contractId" = :contractId
    AND "Executions"."id" NOT IN 
      (SELECT DISTINCT "executionId"
      FROM "CgpVotes")
    ORDER BY "Executions"."blockNumber" ASC, "Txs"."index" ASC
  `;

  return sequelize.query(sql, {
    replacements: {
      contractId,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

cgpDAL.findAllVotesInPhaseByAddress = async function ({
  address,
  beginBlock,
  endBlock,
  type,
  ...options
} = {}) {
  return this.findAll({
    where: {
      address,
      type,
      blockNumber: {
        [Op.gt]: beginBlock,
        [Op.lte]: endBlock,
      },
    },
    ...options,
  });
};

/**
 * Find the highest block number with a valid vote
 * @param {Object} params
 * @param {number} params.startBlockNumber - the highest block number to look from
 * @param {('allocation'|'payout'|'nomination')} params.type - vote type
 * @returns {number} the highest block number with a vote or 0
 */
cgpDAL.findLastValidVoteBlockNumber = async function ({
  startBlockNumber,
  type,
  transaction,
} = {}) {
  const sql = tags.oneLine`
  SELECT v."blockNumber"
  FROM "CgpVotes" v
  WHERE v."type" = :type
    AND v."blockNumber" <= :startBlockNumber
  ORDER BY v."blockNumber" DESC
  LIMIT 1; 
  `;

  return sequelize
    .query(sql, {
      replacements: {
        type,
        startBlockNumber,
      },
      type: sequelize.QueryTypes.SELECT,
      transaction,
    })
    .then((result) => (result.length ? result[0].blockNumber : 0));
};

/**
 * Find all votes for an interval, grouped by execution and filter double votes
 */
cgpDAL.findAllVotesInInterval = async function ({
  snapshot,
  beginBlock,
  endBlock,
  type,
  limit,
  offset = 0,
} = {}) {
  const sql = tags.oneLine`
  SELECT "CgpVotes"."txHash",
    "CgpVotes"."blockNumber",
    "Blocks"."timestamp",
    "CgpVotes"."ballot",
    sum("Snapshots"."amount") AS "amount",
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "CgpVotes"
  INNER JOIN "Blocks" ON "Blocks"."blockNumber" = "CgpVotes"."blockNumber"
  INNER JOIN "Snapshots" 
    ON "Snapshots"."blockNumber" = :snapshot
    AND "CgpVotes"."address" = "Snapshots"."address"
  WHERE "CgpVotes"."address" IS NOT NULL
    AND "CgpVotes"."type" = :type
    AND "CgpVotes"."blockNumber" > :beginBlock
    AND "CgpVotes"."blockNumber" <= :endBlock
  GROUP BY "CgpVotes"."blockNumber", 
          "CgpVotes"."txHash", 
          "CgpVotes"."executionId", 
          "CgpVotes"."ballot", 
          "Blocks","timestamp"
  ORDER BY "CgpVotes"."blockNumber" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset; 
  `;

  return sequelize.query(sql, {
    replacements: {
      type,
      snapshot,
      beginBlock,
      endBlock,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

/**
 * Count all votes in an interval, grouped by execution and filter double votes
 */
cgpDAL.countVotesInInterval = async function ({ beginBlock, endBlock, type } = {}) {
  const sql = tags.oneLine`
  SELECT COUNT(1) FROM
  (SELECT "CgpVotes"."ballot"
  FROM "CgpVotes"
  WHERE "CgpVotes"."address" IS NOT NULL
    AND "CgpVotes"."type" = :type
    AND "CgpVotes"."blockNumber" > :beginBlock
    AND "CgpVotes"."blockNumber" <= :endBlock
  GROUP BY "CgpVotes"."executionId", 
          "CgpVotes"."ballot") AS "Votes"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        beginBlock,
        endBlock,
        type,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

/**
 * Get the repo vote results for an interval
 * per address, get the vote that was done in the earliest block and earliest tx in it
 */
cgpDAL.findAllVoteResults = async function ({
  snapshot,
  beginBlock,
  endBlock,
  type,
  limit,
  offset = 0,
  transaction = null,
} = {}) {
  const sql = tags.oneLine`
  SELECT "CgpVotes"."ballot", 
    sum("Snapshots"."amount") as "amount", 
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "CgpVotes"
  INNER JOIN "Snapshots" 
  ON "Snapshots"."blockNumber" = :snapshot
  AND "CgpVotes"."address" = "Snapshots"."address"
  WHERE "CgpVotes"."type" = :type 
    AND "CgpVotes"."blockNumber" > :beginBlock
    AND "CgpVotes"."blockNumber" <= :endBlock
  GROUP BY "CgpVotes"."ballot"
  ORDER BY "zpAmount" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      snapshot,
      beginBlock,
      endBlock,
      type,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
    transaction,
  });
};

cgpDAL.countAllVoteResults = async function ({ beginBlock, endBlock, type } = {}) {
  const sql = tags.oneLine`
  SELECT count(1) FROM (
    SELECT "CgpVotes"."ballot"
    FROM "CgpVotes"
    WHERE "CgpVotes"."type" = :type 
      AND "CgpVotes"."blockNumber" > :beginBlock
      AND "CgpVotes"."blockNumber" <= :endBlock
    GROUP BY "CgpVotes"."ballot"
  ) AS "Results"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        beginBlock,
        endBlock,
        type,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

cgpDAL.findAllBallots = async function ({
  type,
  snapshot,
  beginBlock,
  endBlock,
  limit,
  offset = 0,
}) {
  const sql = tags.oneLine`
  SELECT "CgpVotes"."ballot", 
    sum("Snapshots"."amount") as "amount", 
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "CgpVotes"
  INNER JOIN "Snapshots" 
  ON "Snapshots"."blockNumber" = :snapshot
  AND "CgpVotes"."address" = "Snapshots"."address"
  WHERE "CgpVotes"."type" = :type
    AND "CgpVotes"."blockNumber" > :beginBlock
    AND "CgpVotes"."blockNumber" <= :endBlock
  GROUP BY "CgpVotes"."ballot"
  ORDER BY "zpAmount" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      type,
      snapshot,
      beginBlock,
      endBlock,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};
cgpDAL.countAllBallots = async function ({ type, beginBlock, endBlock }) {
  const sql = tags.oneLine`
  SELECT count(*) FROM (
    SELECT "CgpVotes"."ballot"
    FROM "CgpVotes"
    WHERE "CgpVotes"."type" = :type
      AND "CgpVotes"."blockNumber" > :beginBlock
      AND "CgpVotes"."blockNumber" <= :endBlock
    GROUP BY "CgpVotes"."ballot"
  ) AS "Results"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        type,
        beginBlock,
        endBlock,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

cgpDAL.findZpParticipated = async function ({ snapshot, beginBlock, endBlock, type } = {}) {
  const sql = tags.oneLine`
  SELECT sum("Snapshots"."amount") AS "amount",
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "CgpVotes"
  INNER JOIN "Snapshots" 
    ON "Snapshots"."blockNumber" = :snapshot
    AND "CgpVotes"."address" = "Snapshots"."address"
  WHERE "CgpVotes"."type" = :type
    AND "CgpVotes"."blockNumber" > :beginBlock
    AND "CgpVotes"."blockNumber" <= :endBlock
  `;

  return sequelize
    .query(sql, {
      replacements: {
        snapshot,
        beginBlock,
        endBlock,
        type,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then((result) => (result.length && result[0].amount ? result[0].amount : '0'));
};

cgpDAL.findAllNominees = async function ({
  snapshot,
  tally,
  threshold,
  limit,
  offset = 0,
  transaction = null,
} = {}) {
  const middle = snapshot + (tally - snapshot) / 2;
  const sql = tags.oneLine`
  SELECT "ballot", "amount", "zpAmount" FROM
  (
    SELECT "CgpVotes"."ballot", 
      sum("Snapshots"."amount") as "amount", 
      (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
    FROM "CgpVotes"
    INNER JOIN "Snapshots" 
      ON "Snapshots"."blockNumber" = :snapshot
      AND "CgpVotes"."address" = "Snapshots"."address"
    WHERE "CgpVotes"."type" = :type
      AND "CgpVotes"."blockNumber" > :snapshot
      AND "CgpVotes"."blockNumber" <= :middle
    GROUP BY "CgpVotes"."ballot"
  ) AS Results
  WHERE "amount" >= :threshold
  ORDER BY "zpAmount" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      type: 'nomination',
      snapshot,
      middle,
      limit,
      offset,
      threshold,
    },
    type: sequelize.QueryTypes.SELECT,
    transaction,
  });
};

cgpDAL.countAllNominees = async function ({
  snapshot,
  tally,
  threshold,
  transaction = null,
} = {}) {
  const middle = snapshot + (tally - snapshot) / 2;
  const sql = tags.oneLine`
  SELECT count(1) from (
    SELECT "ballot" FROM
    (
      SELECT "CgpVotes"."ballot", 
        sum("Snapshots"."amount") as "amount"
      FROM "CgpVotes"
      INNER JOIN "Snapshots" 
        ON "Snapshots"."blockNumber" = :snapshot
        AND "CgpVotes"."address" = "Snapshots"."address"
      WHERE "CgpVotes"."type" = :type
        AND "CgpVotes"."blockNumber" > :snapshot
        AND "CgpVotes"."blockNumber" <= :middle
      GROUP BY "CgpVotes"."ballot"
    ) AS Results
    WHERE "amount" >= :threshold
  ) AS "CountResults"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        type: 'nomination',
        snapshot,
        middle,
        threshold,
      },
      type: sequelize.QueryTypes.SELECT,
      transaction,
    })
    .then(this.queryResultToCount);
};

module.exports = cgpDAL;
