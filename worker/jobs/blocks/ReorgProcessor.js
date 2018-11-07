'use strict';

const logger = require('../../lib/logger');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
// const getJobData = require('../../lib/getJobData');

const MAX_ALLOWED_BLOCKS_TO_DELETE = 500;

class ReorgProcessor {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
  }

  async doJob(job) {
    // try {
    //   logger.info('Updating active contracts commands');
    //   const numOfRowsAffected = await this.processContracts(activeContracts, numOfCommandsToTake);
    //   logger.info(
    //     `Commands for active contracts updated - ${numOfRowsAffected} number of rows affected`
    //   );
    //   return numOfRowsAffected;
    // } catch (error) {
    //   logger.error(`An Error has occurred when processing commands: ${error.message}`);
    //   throw error;
    // }
  }

  async searchFork() {
    const latest = await blocksDAL.findLatest();
    let blockNumber = latest ? latest.blockNumber : 0;
    let foundDifference = false;

    if (latest) {
      while (blockNumber > Math.max(0, latest.blockNumber - MAX_ALLOWED_BLOCKS_TO_DELETE)) {
        const [block, nodeBlock] = await Promise.all([
          blocksDAL.findByBlockNumber(blockNumber),
          this.networkHelper.getBlockFromNode(blockNumber),
        ]);

        if (block.hash !== nodeBlock.hash) {
          foundDifference = true;
        } else {
          if (foundDifference) {
            break;
          }
        }

        blockNumber -= 1;
      }
    }
    return foundDifference ? blockNumber : -1;
  }

  // delete blocks from fork
}

module.exports = ReorgProcessor;
