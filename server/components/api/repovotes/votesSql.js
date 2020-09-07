const JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES = `
INNER JOIN "Executions" ON "Executions"."id" = "RepoVotes"."executionId"
INNER JOIN "Txs" ON "Txs"."id" = "Executions"."txId"
INNER JOIN "Blocks" ON "Blocks"."blockNumber" = "Txs"."blockNumber"
`;

const JOIN_VOTE_INTERVALS_TO_BLOCKS = `
INNER JOIN "RepoVoteIntervals" 
ON "Blocks"."blockNumber" >= "RepoVoteIntervals"."beginBlock"
AND "Blocks"."blockNumber" < "RepoVoteIntervals"."endBlock"
`;

const JOIN_SNAPSHOTS_TO_VOTE_INTERVALS = `
INNER JOIN "Snapshots" 
ON "RepoVoteIntervals"."beginBlock" = "Snapshots"."blockNumber" 
AND "RepoVotes"."address" = "Snapshots"."address"
`;

const JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS = `
INNER JOIN "FilterByBlock"
  ON "RepoVotes"."address" = "FilterByBlock"."address" AND "Blocks"."blockNumber" = "FilterByBlock"."minBlock"
INNER JOIN "FilterByTxIndex"
  ON "RepoVotes"."address" = "FilterByTxIndex"."address" AND "Txs"."index" = "FilterByTxIndex"."minTxIndex"
  AND "FilterByBlock"."address" = "FilterByTxIndex"."address" AND "FilterByBlock"."minBlock" = "FilterByTxIndex"."blockNumber"
`;

const WITH_FILTER_TABLES = `
WITH 
  "FilterByBlock" AS (
    SELECT "RepoVotes"."address",
      min("Blocks"."blockNumber") AS "minBlock"
    FROM "RepoVotes"
    ${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
    ${JOIN_VOTE_INTERVALS_TO_BLOCKS}
    WHERE "RepoVoteIntervals"."interval" = :interval AND "RepoVoteIntervals"."phase" = :phase
    GROUP BY "RepoVotes"."address"
  ),
  "FilterByTxIndex" AS (
    SELECT "RepoVotes"."address",
      "Blocks"."blockNumber",
      min("Txs"."index") AS "minTxIndex"
    FROM "RepoVotes"
    ${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
    ${JOIN_VOTE_INTERVALS_TO_BLOCKS}
    WHERE "RepoVoteIntervals"."interval" = :interval AND "RepoVoteIntervals"."phase" = :phase
    GROUP BY "RepoVotes"."address", "Blocks"."blockNumber"
  )
`;

const FIND_ALL_BY_INTERVAL_BASE_SQL = `
SELECT "ExecutionVotes"."commitId",
  "ExecutionVotes"."zpAmount",
  "ExecutionVotes"."executionId",
  "Blocks"."blockNumber",
  "Blocks"."timestamp",
  "Txs"."hash" AS "txHash"
FROM "Executions"
INNER JOIN "Txs" ON "Executions"."txId" = "Txs"."id"
INNER JOIN "Blocks" ON "Txs"."blockNumber" = "Blocks"."blockNumber"
INNER JOIN (
  SELECT "RepoVotes"."executionId",
    "RepoVotes"."commitId",
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "RepoVotes"
  ${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
  ${JOIN_VOTE_INTERVALS_TO_BLOCKS}
  ${JOIN_SNAPSHOTS_TO_VOTE_INTERVALS}
  ${JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS}
  WHERE "RepoVoteIntervals"."interval" = :interval AND "RepoVoteIntervals"."phase" = :phase AND "RepoVotes"."address" IS NOT NULL
  GROUP BY "RepoVotes"."executionId", "RepoVotes"."commitId"
) AS "ExecutionVotes"
ON "Executions"."id" = "ExecutionVotes"."executionId"
`;

const FIND_ALL_VOTE_RESULTS_BASE_SQL = `
SELECT "RepoVotes"."commitId", (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
FROM "RepoVotes"
${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_VOTE_INTERVALS_TO_BLOCKS}
${JOIN_SNAPSHOTS_TO_VOTE_INTERVALS}
${JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS}
WHERE "RepoVoteIntervals"."interval" = :interval AND "RepoVoteIntervals"."phase" = :phase
GROUP BY "RepoVotes"."commitId"
`;

const FIND_ALL_CANDIDATES = `
SELECT "commitId", "zpAmount" FROM
(SELECT "RepoVotes"."commitId", (sum("Snapshots"."amount") / 100000000) AS "zpAmount", min("RepoVoteIntervals"."thresholdZp") as "thresholdZp"
FROM "RepoVotes"
${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_VOTE_INTERVALS_TO_BLOCKS}
${JOIN_SNAPSHOTS_TO_VOTE_INTERVALS}
${JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS}
WHERE "RepoVoteIntervals"."interval" = :interval AND "RepoVoteIntervals"."phase" = :phase
GROUP BY "RepoVotes"."commitId") AS Results
WHERE "zpAmount" >= "thresholdZp"
`;

module.exports = {
  JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES,
  JOIN_VOTE_INTERVALS_TO_BLOCKS,
  JOIN_SNAPSHOTS_TO_VOTE_INTERVALS,
  JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS,
  WITH_FILTER_TABLES,
  FIND_ALL_BY_INTERVAL_BASE_SQL,
  FIND_ALL_VOTE_RESULTS_BASE_SQL,
  FIND_ALL_CANDIDATES,
};
