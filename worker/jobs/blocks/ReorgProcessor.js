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

  // search fork
  async search() {
    return 0;
  }

  // delete blocks from fork
}

module.exports = ReorgProcessor;