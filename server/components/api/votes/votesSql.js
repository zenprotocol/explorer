const JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES = `
INNER JOIN "Commands" ON "Commands"."id" = "RepoVotes"."CommandId"
INNER JOIN "Transactions" ON "Transactions"."id" = "Commands"."TransactionId"
INNER JOIN "Blocks" ON "Blocks"."id" = "Transactions"."BlockId"
`;

const JOIN_VOTE_INTERVALS_TO_BLOCKS = `
INNER JOIN "VoteIntervals" 
ON "Blocks"."blockNumber" >= "VoteIntervals"."beginHeight"
AND "Blocks"."blockNumber" < "VoteIntervals"."endHeight"
`;

const JOIN_SNAPSHOTS_TO_VOTE_INTERVALS = `
INNER JOIN "Snapshots" 
ON "VoteIntervals"."beginHeight" = "Snapshots"."height" 
AND "RepoVotes"."address" = "Snapshots"."address"
`;

const JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS = `
INNER JOIN "FilterByBlock"
  ON "RepoVotes"."address" = "FilterByBlock"."address" AND "Blocks"."blockNumber" = "FilterByBlock"."minBlock"
INNER JOIN "FilterByTxIndex"
  ON "RepoVotes"."address" = "FilterByTxIndex"."address" AND "Transactions"."index" = "FilterByTxIndex"."minTxIndex"
  AND "FilterByBlock"."address" = "FilterByTxIndex"."address" AND "FilterByBlock"."minBlock" = "FilterByTxIndex"."blockNumber"
`;

const WITH_FILTER_TABLES = `
WITH 
  "FilterByBlock" AS (
    SELECT "RepoVotes"."address",
      min("Blocks"."blockNumber") AS "minBlock"
    FROM "RepoVotes"
    ${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
    ${JOIN_VOTE_INTERVALS_TO_BLOCKS}
    WHERE "VoteIntervals"."interval" = :interval AND "VoteIntervals"."phase" = :phase
    GROUP BY "RepoVotes"."address"
  ),
  "FilterByTxIndex" AS (
    SELECT "RepoVotes"."address",
      "Blocks"."blockNumber",
      min("Transactions"."index") AS "minTxIndex"
    FROM "RepoVotes"
    ${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
    ${JOIN_VOTE_INTERVALS_TO_BLOCKS}
    WHERE "VoteIntervals"."interval" = :interval AND "VoteIntervals"."phase" = :phase
    GROUP BY "RepoVotes"."address", "Blocks"."blockNumber"
  )
`;

const FIND_ALL_BY_INTERVAL_BASE_SQL = `
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
  SELECT "RepoVotes"."CommandId",
    "RepoVotes"."commitId",
    (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
  FROM "RepoVotes"
  ${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
  ${JOIN_VOTE_INTERVALS_TO_BLOCKS}
  ${JOIN_SNAPSHOTS_TO_VOTE_INTERVALS}
  ${JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS}
  WHERE "VoteIntervals"."interval" = :interval AND "VoteIntervals"."phase" = :phase AND "RepoVotes"."address" IS NOT NULL
  GROUP BY "RepoVotes"."CommandId", "RepoVotes"."commitId"
) AS "CommandVotes"
ON "Commands"."id" = "CommandVotes"."CommandId"
`;

const FIND_ALL_VOTE_RESULTS_BASE_SQL = `
SELECT "RepoVotes"."commitId", (sum("Snapshots"."amount") / 100000000) AS "zpAmount"
FROM "RepoVotes"
${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_VOTE_INTERVALS_TO_BLOCKS}
${JOIN_SNAPSHOTS_TO_VOTE_INTERVALS}
${JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS}
WHERE "VoteIntervals"."interval" = :interval AND "VoteIntervals"."phase" = :phase
GROUP BY "RepoVotes"."commitId"
`;

const FIND_ALL_CANDIDATES = `
SELECT "commitId", "zpAmount" FROM
(SELECT "RepoVotes"."commitId", (sum("Snapshots"."amount") / 100000000) AS "zpAmount", min("VoteIntervals"."thresholdZp") as "thresholdZp"
FROM "RepoVotes"
${JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES}
${JOIN_VOTE_INTERVALS_TO_BLOCKS}
${JOIN_SNAPSHOTS_TO_VOTE_INTERVALS}
${JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS}
WHERE "VoteIntervals"."interval" = :interval AND "VoteIntervals"."phase" = :phase
GROUP BY "RepoVotes"."commitId") AS Results
WHERE "zpAmount" >= "thresholdZp"
`;

module.exports = {
  JOIN_COMMANDS_TXS_BLOCKS_TO_REPO_VOTES,
  JOIN_VOTE_INTERVALS_TO_BLOCKS,
  JOIN_SNAPSHOTS_TO_VOTE_INTERVALS,
  JOIN_FILTERS_TO_REPO_VOTES_BLOCK_AND_TXS,
  WITH_FILTER_TABLES,
  FIND_ALL_BY_INTERVAL_BASE_SQL,
  FIND_ALL_VOTE_RESULTS_BASE_SQL,
  FIND_ALL_CANDIDATES,
};
