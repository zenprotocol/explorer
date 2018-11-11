const NetworkHelper = require('../lib/NetworkHelper');
const logger = require('../lib/logger')('searchContracts');
const networkHelper = new NetworkHelper();

const run = async () => {
  const latestBlockNumberInNode = await networkHelper.getLatestBlockNumberFromNode();
  for (let i = latestBlockNumberInNode; i > 0; i--) {
    let found = false;
    // get block
    const nodeBlock = await networkHelper.getBlockFromNode(i);
    const transactionHashes = Object.keys(nodeBlock.transactions);
    logger.info(`search in block ${i}, in ${transactionHashes.length} txs`);
    for (let transactionIndex = 0; transactionIndex < transactionHashes.length; transactionIndex++) {
      const transactionHash = transactionHashes[transactionIndex];
      const nodeTransaction = nodeBlock.transactions[transactionHash];
      if(nodeTransaction.contract) {
        logger.info(`Found - blockNumber=${nodeBlock.header.blockNumber}`);
        found = true;
        break;
      }
    }

    if(found) {
      break;
    }
  }
};

run()
  .then(() => {
    logger.info('Finished');
  })
  .catch(err => {
    logger.error(`An Error has occurred: ${err.message}`);
  });
