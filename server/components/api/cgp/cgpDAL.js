'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');
const cgpIntervalsDAL = require('./cgpIntervalDAL');
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
 * Find all votes for an interval, grouped by command and filter double votes
 */
cgpDAL.findAllVotesInInterval = async function({ snapshot, tally, type, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_BY_INTERVAL_BASE_SQL}
  ORDER BY "Blocks"."blockNumber" DESC
  LIMIT :limit OFFSET :offset; 
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
cgpDAL.findAllVoteResults = async function({ snapshot, tally, type, limit, offset = 0, dbTransaction = null } = {}) {
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

cgpDAL.findWinners = async function({ interval, dbTransaction = null } = {}) {
  return cgpIntervalsDAL.findOne({
    where: {
      interval,
    },
    transaction: dbTransaction,
  });
};

cgpDAL.findAllBallots = async function({ type, intervalLength, limit, offset = 0 }) {
  const sql = tags.oneLine`
  ${FIND_ALL_BALLOTS_BASE_SQL}
  ORDER BY "zpAmount" DESC
  LIMIT :limit OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      type,
      intervalLength,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};
cgpDAL.countAllBallots = async function({ type, intervalLength }) {
  const sql = tags.oneLine`
  SELECT count(*) FROM (${FIND_ALL_BALLOTS_BASE_SQL}) AS "Results"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        type,
        intervalLength,
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

module.exports = cgpDAL;
