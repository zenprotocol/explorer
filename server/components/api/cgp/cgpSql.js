const JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES = `
INNER JOIN "Executions" ON "Executions"."id" = "CgpVotes"."executionId"
INNER JOIN "Txs" ON "Txs"."id" = "Executions"."txId"
INNER JOIN "Blocks" ON "Blocks"."blockNumber" = "Txs"."blockNumber"
  AND "Blocks"."blockNumber" > CASE :type WHEN 'nomination' THEN :snapshot ELSE :snapshot + ((:tally - :snapshot) / 2) END
  AND "Blocks"."blockNumber" <= CASE :type WHEN 'nomination' THEN :snapshot + ((:tally - :snapshot) / 2) ELSE :tally END
`;

const JOIN_SNAPSHOTS_TO_CGP_VOTES = `
INNER JOIN "Snapshots" 
ON "Snapshots"."blockNumber" = :snapshot
AND "CgpVotes"."address" = "Snapshots"."address"
`;

const JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS = `
INNER JOIN "FilterByBlock"
  ON "CgpVotes"."address" = "FilterByBlock"."address" 
  AND "CgpVotes"."type" = "FilterByBlock"."type" 
  AND "Blocks"."blockNumber" = "FilterByBlock"."minBlock"
INNER JOIN "FilterByTxIndex"
  ON "CgpVotes"."address" = "FilterByTxIndex"."address" 
  AND "CgpVotes"."type" = "FilterByTxIndex"."type" 
  AND "Txs"."index" = "FilterByTxIndex"."minTxIndex"
  AND "FilterByBlock"."address" = "FilterByTxIndex"."address" 
  AND "FilterByBlock"."minBlock" = "FilterByTxIndex"."blockNumber"
`;

const WITH_FILTER_TABLES = `
WITH 
  "FilterByBlock" AS (
    SELECT "CgpVotes"."address",
      "CgpVotes"."type",
      min("Blocks"."blockNumber") AS "minBlock"
    FROM "CgpVotes"
    ${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
    GROUP BY "CgpVotes"."address", "CgpVotes"."type"
  ),
  "FilterByTxIndex" AS (
    SELECT "CgpVotes"."address",
      "CgpVotes"."type",
      "Blocks"."blockNumber",
      min("Txs"."index") AS "minTxIndex"
    FROM "CgpVotes"
    ${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
    GROUP BY "CgpVotes"."address", "CgpVotes"."type", "Blocks"."blockNumber"
  )
`;

const FIND_ALL_BY_INTERVAL_BASE_SQL = `
SELECT "ExecutionVotes"."ballot",
  "ExecutionVotes"."amount",
  "ExecutionVotes"."zpAmount",
  "ExecutionVotes"."executionId",
  "Blocks"."blockNumber",
  "Blocks"."timestamp",
  "Txs"."hash" AS "txHash"
FROM "Executions"
INNER JOIN "Txs" ON "Executions"."txId" = "Txs"."id"
INNER JOIN "Blocks" ON "Txs"."blockNumber" = "Blocks"."blockNumber"
INNER JOIN (
  SELECT "CgpVotes"."executionId",
    "CgpVotes"."ballot",
    sum("Snapshots"."amount") AS "amount",
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "CgpVotes"
  ${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
  ${JOIN_SNAPSHOTS_TO_CGP_VOTES}
  ${JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS}
  WHERE "CgpVotes"."address" IS NOT NULL
    AND "CgpVotes"."type" = :type
  GROUP BY "CgpVotes"."executionId", "CgpVotes"."ballot"
) AS "ExecutionVotes"
ON "Executions"."id" = "ExecutionVotes"."executionId"
`;

const FIND_ALL_VOTE_RESULTS_BASE_SQL = `
SELECT "CgpVotes"."ballot", 
  sum("Snapshots"."amount") as "amount", 
  (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
FROM "CgpVotes"
${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_SNAPSHOTS_TO_CGP_VOTES}
${JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS}
WHERE "CgpVotes"."type" = :type
GROUP BY "CgpVotes"."ballot"
`;

const FIND_ALL_ZP_PARTICIPATED_BASE_SQL = `
SELECT sum("Snapshots"."amount") AS "amount",
  (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
FROM "CgpVotes"
${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_SNAPSHOTS_TO_CGP_VOTES}
${JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS}
WHERE "CgpVotes"."type" = :type
`;

const FIND_ALL_BALLOTS_BASE_SQL = `
SELECT "CgpVotes"."ballot", 
  sum("Snapshots"."amount") as "amount", 
  (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
FROM "CgpVotes"
${JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_SNAPSHOTS_TO_CGP_VOTES}
${JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS}
WHERE "CgpVotes"."type" = :type
GROUP BY "CgpVotes"."ballot"
`;

module.exports = {
  JOIN_EXECUTIONS_TXS_BLOCKS_TO_REPO_VOTES,
  JOIN_SNAPSHOTS_TO_CGP_VOTES,
  JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS,
  WITH_FILTER_TABLES,
  FIND_ALL_BY_INTERVAL_BASE_SQL,
  FIND_ALL_VOTE_RESULTS_BASE_SQL,
  FIND_ALL_BALLOTS_BASE_SQL,
  FIND_ALL_ZP_PARTICIPATED_BASE_SQL,
};
