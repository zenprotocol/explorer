'use strict';

const EventEmitter = require('events');
const logger = require('../../lib/logger')('reorg');
const blocksDAL = require('../../../server/components/api/blocks/blocksDAL');
const Op = require('../../../server/db/sequelize/models').sequelize.Op;
const getJobData = require('../../lib/getJobData');
const QueueError = require('../../lib/QueueError');

const MAX_ALLOWED_BLOCKS_TO_DELETE = 500;

class ReorgProcessor extends EventEmitter {
  constructor(networkHelper) {
    super();
    this.networkHelper = networkHelper;
  }

  async doJob(job) {
    this.on('fork-found', blockNumber => logger.info(`Fork found at block number ${blockNumber}`));
    try {
      const searchAll = getJobData(job, 'all') === true; // do not search all by default
      const preventDelete = getJobData(job, 'delete') === false; // delete by default
      let deleted = 0;

      logger.info('Searching for reorg forks...');
      if (searchAll) {
        logger.info('all flag is on - will search in all blocks');
      }
      const forks = await this.searchForks(searchAll);

      if (forks.length) {
        if (preventDelete) {
          logger.info('delete flag is marked false, will not delete blocks.');
        } else {
          const lowestFork = forks[forks.length - 1];
          logger.info(`Deleting all blocks with blockNumber > ${lowestFork}`);
          deleted = await blocksDAL.bulkDelete({
            where: {
              blockNumber: {
                [Op.gt]: lowestFork,
              },
            },
          });
        }
      } else {
        logger.info('Did not find a fork');
      }

      return { forks, deleted };
    } catch (error) {
      logger.error(`An Error has occurred when processing a reorg: ${error.message}`);
      throw new QueueError(error);
    }
  }

  async searchForks(searchAll = false) {
    const forks = [];
    const latest = await blocksDAL.findLatest();
    const lowestBlockNumber = searchAll
      ? 1
      : Math.max(1, latest.blockNumber - MAX_ALLOWED_BLOCKS_TO_DELETE);
    let blockNumber = latest ? latest.blockNumber : 0;
    let foundDifference = false;

    if (latest) {
      while (blockNumber >= lowestBlockNumber) {
        this.emit('scan-block', blockNumber);
        const [block, nodeBlock] = await Promise.all([
          blocksDAL.findByBlockNumber(blockNumber),
          this.networkHelper.getBlockFromNode(blockNumber),
        ]);

        if (block.hash !== nodeBlock.hash) {
          foundDifference = true;
        } else {
          if (foundDifference) {
            this.emit('fork-found', blockNumber);
            forks.push(blockNumber);
            foundDifference = false;
            if(!searchAll) {
              break;
            }
          }
        }

        blockNumber -= 1;
      }
    }

    // special case - handle block number 1
    if(foundDifference) {
      forks.push(0);
    }

    return forks;
  }
}

module.exports = ReorgProcessor;
