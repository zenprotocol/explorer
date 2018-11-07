'use strict';

const logger = require('../../lib/logger');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const Op = require('../../../server/db/sequelize/models').sequelize.Op;
// const getJobData = require('../../lib/getJobData');

const MAX_ALLOWED_BLOCKS_TO_DELETE = 500;

class ReorgProcessor {
  constructor(networkHelper) {
    this.networkHelper = networkHelper;
  }

  async doJob(job) {
    try {
      logger.info('Searching for a reorg fork...');
      const fork = await this.searchFork();

      if (fork > -1) {
        logger.info(`Fork found at block number ${fork}`);
        return await blocksDAL.bulkDelete({
          where: {
            blockNumber: {
              [Op.gt]: fork,
            }
          }
        });
      } else {
        logger.info('Did not find a fork');
        return 0;
      }
    } catch (error) {
      logger.error(`An Error has occurred when processing a reorg: ${error.message}`);
      throw error;
    }
  }

  async searchFork(startAt, endAt) {
    const latest = startAt
      ? await blocksDAL.findByBlockNumber(startAt)
      : await blocksDAL.findLatest();
    const lowestBlockNumber = endAt
      ? Math.max(1, endAt)
      : Math.max(1, latest.blockNumber - MAX_ALLOWED_BLOCKS_TO_DELETE);
    let blockNumber = latest ? latest.blockNumber : 0;
    let foundDifference = false;

    if (latest) {
      while (blockNumber >= lowestBlockNumber) {
        logger.info(`searching block ${blockNumber}`);
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
}

module.exports = ReorgProcessor;
