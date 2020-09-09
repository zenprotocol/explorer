'use strict';

const tags = require('common-tags');
const dal = require('../../../lib/dal');
const db = require('../../../db/sequelize/models');
const {
  WITH_FILTER_TABLES,
  FIND_ALL_BY_INTERVAL_BASE_SQL,
  FIND_ALL_VOTE_RESULTS_BASE_SQL,
  FIND_ALL_CANDIDATES,
} = require('./repoVotesSql');

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
        [Op.gte]: beginBlock,
        [Op.lt]: endBlock,
      },
    },
    ...options,
  });
};
/**
 * Find all votes for an interval, grouped by execution and filter double votes
 */
votesDAL.findAllByInterval = async function ({ interval, phase, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_BY_INTERVAL_BASE_SQL}
  ORDER BY "Blocks"."blockNumber" DESC
  LIMIT :limit OFFSET :offset; 
  `;

  return sequelize.query(sql, {
    replacements: {
      interval,
      phase,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

/**
 * Count all votes for an interval, grouped by execution and filter double votes
 */
votesDAL.countByInterval = async function ({ interval, phase } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT count(*) FROM (${FIND_ALL_BY_INTERVAL_BASE_SQL}) AS "Votes";
  `;

  return sequelize
    .query(sql, {
      replacements: {
        interval,
        phase,
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
votesDAL.findAllVoteResults = async function ({ interval, phase, limit, offset = 0 } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_VOTE_RESULTS_BASE_SQL}
  ORDER BY "zpAmount" DESC
  LIMIT :limit OFFSET :offset;
  `;

  return sequelize.query(sql, {
    replacements: {
      interval,
      phase,
      limit,
      offset,
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

votesDAL.countAllVoteResults = async function ({ interval, phase } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  SELECT count(*) FROM (${FIND_ALL_VOTE_RESULTS_BASE_SQL}) AS "Results"
  `;

  return sequelize
    .query(sql, {
      replacements: {
        interval,
        phase,
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then(this.queryResultToCount);
};

votesDAL.findContestantWinners = async function ({ interval } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_CANDIDATES}
  ORDER BY "zpAmount" DESC
  `;

  return sequelize.query(sql, {
    replacements: {
      interval,
      phase: 'Contestant',
    },
    type: sequelize.QueryTypes.SELECT,
  });
};

votesDAL.findCandidateWinner = async function ({ interval } = {}) {
  const sql = tags.oneLine`
  ${WITH_FILTER_TABLES}
  ${FIND_ALL_VOTE_RESULTS_BASE_SQL}
  ORDER BY "zpAmount" DESC
  LIMIT 1; 
  `;

  return sequelize
    .query(sql, {
      replacements: {
        interval,
        phase: 'Candidate',
      },
      type: sequelize.QueryTypes.SELECT,
    })
    .then((results) => (results.length ? results[0] : null));
};

module.exports = votesDAL;
