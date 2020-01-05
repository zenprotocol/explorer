const JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES = `
INNER JOIN "Commands" ON "Commands"."id" = "CGPVotes"."CommandId"
INNER JOIN "Transactions" ON "Transactions"."id" = "Commands"."TransactionId"
INNER JOIN "Blocks" ON "Blocks"."id" = "Transactions"."BlockId"
  AND "Blocks"."blockNumber" > :snapshot
  AND "Blocks"."blockNumber" <= :tally
`;

const JOIN_SNAPSHOTS_TO_CGP_VOTES = `
INNER JOIN "Snapshots" 
ON "Snapshots"."height" = :snapshot
AND "CGPVotes"."address" = "Snapshots"."address"
`;

const JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS = `
INNER JOIN "FilterByBlock"
  ON "CGPVotes"."address" = "FilterByBlock"."address" 
  AND "CGPVotes"."type" = "FilterByBlock"."type" 
  AND "Blocks"."blockNumber" = "FilterByBlock"."minBlock"
INNER JOIN "FilterByTxIndex"
  ON "CGPVotes"."address" = "FilterByTxIndex"."address" 
  AND "CGPVotes"."type" = "FilterByTxIndex"."type" 
  AND "Transactions"."index" = "FilterByTxIndex"."minTxIndex"
  AND "FilterByBlock"."address" = "FilterByTxIndex"."address" 
  AND "FilterByBlock"."minBlock" = "FilterByTxIndex"."blockNumber"
`;

const WITH_FILTER_TABLES = `
WITH 
  "FilterByBlock" AS (
    SELECT "CGPVotes"."address",
      "CGPVotes"."type",
      min("Blocks"."blockNumber") AS "minBlock"
    FROM "CGPVotes"
    ${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
    GROUP BY "CGPVotes"."address", "CGPVotes"."type"
  ),
  "FilterByTxIndex" AS (
    SELECT "CGPVotes"."address",
      "CGPVotes"."type",
      "Blocks"."blockNumber",
      min("Transactions"."index") AS "minTxIndex"
    FROM "CGPVotes"
    ${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
    GROUP BY "CGPVotes"."address", "CGPVotes"."type", "Blocks"."blockNumber"
  )
`;

const FIND_ALL_BY_INTERVAL_BASE_SQL = `
SELECT "CommandVotes"."ballot",
  "CommandVotes"."zpAmount",
  "CommandVotes"."CommandId",
  "Blocks"."blockNumber",
  "Blocks"."timestamp",
  "Transactions"."hash" AS "txHash"
FROM "Commands"
INNER JOIN "Transactions" ON "Commands"."TransactionId" = "Transactions"."id"
INNER JOIN "Blocks" ON "Transactions"."BlockId" = "Blocks"."id"
INNER JOIN (
  SELECT "CGPVotes"."CommandId",
    "CGPVotes"."ballot",
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "CGPVotes"
  ${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
  ${JOIN_SNAPSHOTS_TO_CGP_VOTES}
  ${JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS}
  WHERE "CGPVotes"."address" IS NOT NULL
    AND "CGPVotes"."type" = :type
  GROUP BY "CGPVotes"."CommandId", "CGPVotes"."ballot"
) AS "CommandVotes"
ON "Commands"."id" = "CommandVotes"."CommandId"
`;

const FIND_ALL_VOTE_RESULTS_BASE_SQL = `
SELECT "CGPVotes"."ballot", 
  sum("Snapshots"."amount") as "amount", 
  (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
FROM "CGPVotes"
${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_SNAPSHOTS_TO_CGP_VOTES}
${JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS}
WHERE "CGPVotes"."type" = :type
GROUP BY "CGPVotes"."ballot"
`;

const FIND_ALL_ZP_PARTICIPATED_BASE_SQL = `
SELECT sum("Snapshots"."amount") AS "amount",
  (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
FROM "CGPVotes"
${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_SNAPSHOTS_TO_CGP_VOTES}
${JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS}
WHERE "CGPVotes"."type" = :type
`;

const FIND_ALL_BALLOTS_BASE_SQL = `
WITH 
  "FilterByBlock" AS (
    SELECT "CGPVotes"."address",
      "CGPVotes"."type",
      (floor(("Blocks"."blockNumber" - 1) / :intervalLength) * :intervalLength + :intervalLength * 0.9) AS "snapshotHeight",
      min("Blocks"."blockNumber") AS "minBlock"
    FROM "CGPVotes"
    INNER JOIN "Commands" ON "Commands"."id" = "CGPVotes"."CommandId"
    INNER JOIN "Transactions" ON "Transactions"."id" = "Commands"."TransactionId"
    INNER JOIN "Blocks" ON "Blocks"."id" = "Transactions"."BlockId"
      AND ("Blocks"."blockNumber" - 1) % 100 >= (:intervalLength * 0.9)
      AND ("Blocks"."blockNumber" - 1) % 100 < :intervalLength
    GROUP BY "CGPVotes"."address", "CGPVotes"."type", (floor(("Blocks"."blockNumber" - 1) / :intervalLength) * :intervalLength + :intervalLength * 0.9) 
  ),
  "FilterByTxIndex" AS (
    SELECT "CGPVotes"."address",
      "CGPVotes"."type",
      "Blocks"."blockNumber",
      (floor(("Blocks"."blockNumber" - 1) / :intervalLength) * :intervalLength + :intervalLength * 0.9) AS "snapshotHeight",
      min("Transactions"."index") AS "minTxIndex"
    FROM "CGPVotes"
    INNER JOIN "Commands" ON "Commands"."id" = "CGPVotes"."CommandId"
    INNER JOIN "Transactions" ON "Transactions"."id" = "Commands"."TransactionId"
    INNER JOIN "Blocks" ON "Blocks"."id" = "Transactions"."BlockId"
      AND ("Blocks"."blockNumber" - 1) % 100 >= (:intervalLength * 0.9)
      AND ("Blocks"."blockNumber" - 1) % 100 < :intervalLength
    GROUP BY "CGPVotes"."address", "CGPVotes"."type", "Blocks"."blockNumber", (floor(("Blocks"."blockNumber" - 1) / :intervalLength) * :intervalLength + :intervalLength * 0.9) 
  )

SELECT "CGPVotes"."ballot", (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
FROM "CGPVotes"
INNER JOIN "Commands" ON "Commands"."id" = "CGPVotes"."CommandId"
INNER JOIN "Transactions" ON "Transactions"."id" = "Commands"."TransactionId"
INNER JOIN "Blocks" ON "Blocks"."id" = "Transactions"."BlockId"
  AND ("Blocks"."blockNumber" - 1) % 100 >= (:intervalLength * 0.9)
  AND ("Blocks"."blockNumber" - 1) % 100 < :intervalLength
INNER JOIN "Snapshots" 
  ON "Snapshots"."height" =  floor(("Blocks"."blockNumber" - 1) / :intervalLength) * :intervalLength + :intervalLength * 0.9
  AND "CGPVotes"."address" = "Snapshots"."address"

INNER JOIN "FilterByBlock"
  ON "CGPVotes"."address" = "FilterByBlock"."address" 
  AND "CGPVotes"."type" = "FilterByBlock"."type" 
  AND "Blocks"."blockNumber" = "FilterByBlock"."minBlock"
  AND "Snapshots"."height" = "FilterByBlock"."snapshotHeight"
INNER JOIN "FilterByTxIndex"
  ON "CGPVotes"."address" = "FilterByTxIndex"."address" 
  AND "CGPVotes"."type" = "FilterByTxIndex"."type" 
  AND "Transactions"."index" = "FilterByTxIndex"."minTxIndex"
  AND "FilterByBlock"."address" = "FilterByTxIndex"."address" 
  AND "FilterByBlock"."minBlock" = "FilterByTxIndex"."blockNumber"
  AND "Snapshots"."height" = "FilterByTxIndex"."snapshotHeight"

WHERE "CGPVotes"."type" = :type
GROUP BY "CGPVotes"."ballot"
`;

module.exports = {
  JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES,
  JOIN_SNAPSHOTS_TO_CGP_VOTES,
  JOIN_FILTERS_TO_CGP_VOTES_BLOCK_AND_TXS,
  WITH_FILTER_TABLES,
  FIND_ALL_BY_INTERVAL_BASE_SQL,
  FIND_ALL_VOTE_RESULTS_BASE_SQL,
  FIND_ALL_BALLOTS_BASE_SQL,
  FIND_ALL_ZP_PARTICIPATED_BASE_SQL,
};
