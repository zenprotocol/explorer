'use strict';

const path = require('path');
const Queue = require('bull');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('reorg');
const slackLogger = require('../server/lib/slackLogger');

const reorgsQueue = new Queue(
  Config.get('queues:reorgs:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
reorgsQueue.process(path.join(__dirname, 'jobs/blocks/reorgs.handler.js'));

// events
reorgsQueue.on('active', function(job, jobPromise) {
  logger.info(`A search all job has started. ID=${job.id}`);
});

reorgsQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. ID=${job.id} result=${JSON.stringify(result)}`);
  if(result.forks.length > 0) {
    slackLogger.error(`A reorg scan was completed and found forks! ${JSON.stringify(result)}`);
  }
});

reorgsQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error}`);
  taskTimeLimiter.executeTask(() => {
    slackLogger.error(`A reorgsQueue job has failed, error=${error}`);
  });
});

// first clean the queue
Promise.all([
  reorgsQueue.clean(0, 'active'),
  reorgsQueue.clean(0, 'delayed'),
  reorgsQueue.clean(0, 'wait'),
  reorgsQueue.clean(0, 'completed'),
  reorgsQueue.clean(0, 'failed'),
]).then(() => {
  // schedule - search all of the blocks for forks
  reorgsQueue.add(
    { all: true, delete: false },
    { repeat: { cron: '0 2 * * *' } } // once a day at 2:00
  );
});

setInterval(() => {
  reorgsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  reorgsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
