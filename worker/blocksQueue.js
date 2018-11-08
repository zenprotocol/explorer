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
const reorgsQueue = new Queue(
  Config.get('queues:reorgs:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
addBlocksQueue.process(path.join(__dirname, 'jobs/blocks/addNewBlocks.handler.js'));
reorgsQueue.process(path.join(__dirname, 'jobs/blocks/reorgs.handler.js'));

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
  if(error.message === 'Reorg') {
    const message = 'Found a reorg! starting the reorg processor...';
    logger.info(message);
    slackLogger.log(message);
    addBlocksQueue.pause();
    reorgsQueue.add();
  }
});

reorgsQueue.on('active', function(job, jobPromise) {
  logger.info('A reorgsQueue search one and delete job has started.');
});

reorgsQueue.on('completed', function(job, result) {
  if(result.deleted > 0) {
    const message = `A reorg was successfully handled: ${JSON.stringify(result)}`;
    logger.info(message);
    slackLogger.log(message);
    addBlocksQueue.resume();
  }
  else {
    const message = `Could not handle a reorg: ${JSON.stringify(result)}`;
    logger.error(message);
    slackLogger.error(message);
  }
});

reorgsQueue.on('failed', function(job, error) {
  logger.error(`An reorgsQueue job has failed. ID=${job.id}, error=${error}`);
  taskTimeLimiter.executeTask(() => {
    slackLogger.error(`An reorgsQueue job has failed, error=${error}`);
  });
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
