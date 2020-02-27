'use strict';

const tags = require('common-tags');
const { Decimal } = require('decimal.js');
const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');
const calcTotalZpByHeight = require('../../../lib/calcTotalZpByHeight');
const {
  WITH_FILTER_TABLES,
  FIND_ALL_BY_INTERVAL_BASE_SQL,
  FIND_ALL_VOTE_RESULTS_BASE_SQL,
  FIND_ALL_BALLOTS_BASE_SQL,
  FIND_ALL_ZP_PARTICIPATED_BASE_SQL,
} = require('./cgpSql');

const sequelize = db.sequelize;
const cgpDAL = dal.createDAL('CGPVote');

cgpDAL.findAllUnprocessedCommands = async function(contractId) {
  const sql = tags.oneLine`
    SELECT "Commands".*
    FROM "Commands"
    INNER JOIN "Transactions" ON "Commands"."TransactionId" = "Transactions"."id"
    INNER JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
    WHERE "Commands"."ContractId" = :contractId
    AND "Commands"."id" NOT IN 
      (SELECT DISTINCT "CommandId"
      FROM "CGPVotes")
    ORDER BY "Blocks"."blockNumber" ASC, "Transactions"."index" ASC
  `;

  return sequelize.query(sql, {
    replacements: {
      contractId,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

/**
 * Find the highest block number with a valid vote
 * @param {Object} params
 * @param {number} params.startBlockNumber - the highest block number to look from
 * @param {number} params.intervalLength
 * @param {number} params.interval1Snapshot - the snapshot of interval 1
 * @param {number} params.interval1Tally - the tally of interval 1
 * @param {('allocation'|'payout')} params.type - vote type
 * @returns {number} the highest block number with a vote or 0
 */
cgpDAL.findLastValidVoteBlockNumber = async function({
  startBlockNumber,
  intervalLength,
  interval1Snapshot,
  interval1Tally,
  type,
  dbTransaction,
} = {}) {
  const sql = tags.oneLine`
  SELECT "Blocks"."blockNumber"
  FROM "CGPVotes"
  INNER JOIN "Commands" ON "Commands"."id" = "CGPVotes"."CommandId"
  INNER JOIN "Transactions" ON "Transactions"."id" = "Commands"."TransactionId"
  INNER JOIN "Blocks" ON "Blocks"."id" = "Transactions"."BlockId"
    AND ("Blocks"."blockNumber" - 1) % :intervalLength > :interval1Snapshot - 1
    AND ("Blocks"."blockNumber" - 1) % :intervalLength < :interval1Tally
    AND "Blocks"."blockNumber" <= :startBlockNumber
  WHERE "CGPVotes"."type" = :type
  ORDER BY "Blocks"."blockNumber" DESC
  LIMIT 1; 
  `;

  return sequelize
    .query(sql, {
      replacements: {
        type,
        startBlockNumber,
        intervalLength,
        interval1Snapshot,
        interval1Tally,
      },
      type: sequelize.QueryTypes.SELECT,
      transaction: dbTransaction,
    })
    .then(result => (result.length ? result[0].blockNumber : 0));
};

/**
 * Find all votes for an interval, grouped by command and filter double votes
 */
cgpDAL.findAllVotesInInterval = async function({ snapshot, tally, type, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_BY_INTERVAL_BASE_SQL}
  ORDER BY "Blocks"."blockNumber" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset; 
  `;

  return sequelize.query(sql, {
    replacements: {
      type,
      snapshot,
      tally,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

/**
 * Count all votes in an interval, grouped by command and filter double votes
 */
cgpDAL.countVotesInInterval = async function({ snapshot, tally, type } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT count(*) FROM (${FIND_ALL_BY_INTERVAL_BASE_SQL}) AS "Votes";
  `;

  return sequelize
    .query(sql, {
      replacements: {
        snapshot,
        tally,
        type,
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
cgpDAL.findAllVoteResults = async function({
  snapshot,
  tally,
  type,
  limit,
  offset = 0,
  dbTransaction = null,
} = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_VOTE_RESULTS_BASE_SQL}
  ORDER BY "zpAmount" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      snapshot,
      tally,
      type,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};

cgpDAL.countAllVoteResults = async function({ snapshot, tally, type } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT count(*) FROM (${FIND_ALL_VOTE_RESULTS_BASE_SQL}) AS "Results"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        snapshot,
        tally,
        type,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

cgpDAL.findAllBallots = async function({ type, snapshot, tally, limit, offset = 0 }) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_BALLOTS_BASE_SQL}
  ORDER BY "zpAmount" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      type,
      snapshot,
      tally,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};
cgpDAL.countAllBallots = async function({ type, snapshot, tally }) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT count(*) FROM (${FIND_ALL_BALLOTS_BASE_SQL}) AS "Results"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        type,
        snapshot,
        tally,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

cgpDAL.findZpParticipated = async function({ snapshot, tally, type } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_ZP_PARTICIPATED_BASE_SQL}
  `;

  return sequelize
    .query(sql, {
      replacements: {
        snapshot,
        tally,
        type,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(result => (result.length && result[0].amount ? result[0].amount : '0'));
};

cgpDAL.findAllNominees = async function({
  snapshot,
  tally,
  genesisTotal = '20000000',
  limit,
  offset = 0,
  dbTransaction = null,
} = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT "ballot", "amount", "zpAmount" FROM
  (${FIND_ALL_BALLOTS_BASE_SQL}) AS Results
  WHERE "amount" >= :threshold
  ORDER BY "zpAmount" DESC
  ${limit ? 'LIMIT :limit' : ''} OFFSET :offset;
  `;

  const threshold = new Decimal(calcTotalZpByHeight({ height: snapshot, genesis: genesisTotal }))
    .times(3)
    .div(100)
    .toFixed(8);

  return sequelize.query(sql, {
    replacements: {
      type: 'nomination',
      snapshot,
      tally,
      limit,
      offset,
      threshold,
    },
    type: sequelize.QueryTypes.SELECT,
    transaction: dbTransaction,
  });
};

cgpDAL.countAllNominees = async function({
  snapshot,
  tally,
  genesisTotal = '20000000',
  dbTransaction = null,
} = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT count(*) from (
    SELECT "ballot", "amount" FROM
    (${FIND_ALL_BALLOTS_BASE_SQL}) AS Results
    WHERE "amount" >= :threshold
  ) AS "CountResults"
  `;

  const threshold = new Decimal(calcTotalZpByHeight({ height: snapshot, genesis: genesisTotal }))
    .times(3)
    .div(100)
    .toFixed(8);

  return sequelize
    .query(sql, {
      replacements: {
        type: 'nomination',
        snapshot,
        tally,
        threshold,
      },
      type: sequelize.QueryTypes.SELECT,
      transaction: dbTransaction,
    })
    .then(this.queryResultToCount);
};

module.exports = cgpDAL;
