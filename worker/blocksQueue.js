'use strict';

const path = require('path');
const Queue = require('bull');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger');
const slackLogger = require('../server/lib/slackLogger');
const NUM_OF_BLOCKS_IN_CHUNK = Config.get('queues:addBlocks:limitBlocks');

const addBlocksQueue = new Queue(
  Config.get('queues:addBlocks:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
addBlocksQueue.process(path.join(__dirname, 'jobs/blocks/addNewBlocks.handler.js'));

// events
addBlocksQueue.on('error', function(error) {
  logger.error('A AddBlocksQueue job error has occurred', error);
});

addBlocksQueue.on('active', function(job, jobPromise) {
  logger.info(`An AddBlocksQueue job has started. ID=${job.id}`);
});

addBlocksQueue.on('completed', function(job, result) {
  logger.info(`An AddBlocksQueue job has been completed. ID=${job.id} result=${result}`);
  if(result > 0) {
    addBlocksQueue.add(
      { limitBlocks: NUM_OF_BLOCKS_IN_CHUNK },
    );
  }
});

addBlocksQueue.on('failed', function(job, error) {
  logger.error(`An AddBlocksQueue job has failed. ID=${job.id}, error=${error}`);
  taskTimeLimiter.executeTask(() => {
    slackLogger.error(`An AddBlocks job has failed, error=${error}`);
  });
});

addBlocksQueue.on('cleaned', function(jobs, type) {
  logger.info('AddBlocksQueue Jobs have been cleaned', { jobs, type });
});

// first clean the queue
Promise.all([
  addBlocksQueue.clean(0, 'active'),
  addBlocksQueue.clean(0, 'delayed'),
  addBlocksQueue.clean(0, 'wait'),
  addBlocksQueue.clean(0, 'completed'),
  addBlocksQueue.clean(0, 'failed'),
]).then(() => {
  // schedule ---
  addBlocksQueue.add(
    { limitBlocks: NUM_OF_BLOCKS_IN_CHUNK },
    { repeat: { cron: '* * * * *' } }
  );
  // now
  addBlocksQueue.add(
    { limitBlocks: NUM_OF_BLOCKS_IN_CHUNK },
  );
});

setInterval(() => {
  addBlocksQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  addBlocksQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
