/**
 * Search the node for a block that contains a txHash
 * Flags:
 * -t [txHash] - the txHash to search
 * -asc - search from block 1 upwards (defaults to last block downwards)
 */
const NetworkHelper = require('../lib/NetworkHelper');
const logger = require('../lib/logger')('reorg-search');

const networkHelper = new NetworkHelper();

const run = async () => {
  const txHash = getTxHash();
  if (!txHash) {
    throw new Error('please provide a tx hash: -t <txHash>');
  }

  const isAsc = searchAsc();
  const latestBlockNumberInNode = await networkHelper.getLatestBlockNumberFromNode();

  const startBlock = isAsc ? 1 : latestBlockNumberInNode;
  const condition = blockNumber => {
    return isAsc ? blockNumber < latestBlockNumberInNode : blockNumber > 0;
  };
  const nextBlockNumber = blockNumber => (isAsc ? blockNumber + 1 : blockNumber - 1);

  logger.info('Search for a txHash in a block');
  for (let i = startBlock; condition(i); i = nextBlockNumber(i)) {
    logger.info(`search in block ${i}`);
    const nodeBlock = await networkHelper.getBlockFromNode(i);
    const transactionHashes = Object.keys(nodeBlock.transactions);
    if (transactionHashes.includes(txHash)) {
      return i;
    }
  }

  return 0;
};

run()
  .then(blockNumber => {
    let logMsg = 'Finished searching: ';
    if (blockNumber) {
      logger.info(`${logMsg}Found the txHash in block number ${blockNumber}`);
    } else {
      logger.info(`${logMsg}Did not find this txHash in any block`);
    }
  })
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  });

function searchAsc() {
  return process.argv.includes('-asc');
}

function getTxHash() {
  let txHash = '';
  if (process.argv.includes('-t')) {
    const flagIndex = process.argv.indexOf('-t');
    if (process.argv.length > flagIndex + 1) {
      const hash = process.argv[flagIndex + 1];
      if (hash && !hash.startsWith('-') && hash.length > 60) {
        txHash = hash;
      }
    }
  }
  return txHash;
}
