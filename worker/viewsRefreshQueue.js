'use strict';

const path = require('path');
const Queue = require('bull');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('views-refresh');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('./lib/getChain');

const viewsRefreshQueue = new Queue(
  Config.get('queues:views-refresh:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
viewsRefreshQueue.process(path.join(__dirname, 'jobs/views/refresh.handler.js'));

// events
viewsRefreshQueue.on('active', function(job, jobPromise) {
  logger.info(`A job has started. ID=${job.id}`);
});

viewsRefreshQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. ID=${job.id} result=${result}`);
});

viewsRefreshQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(`A viewsRefreshQueue job has failed, error=${error.message} chain=${chain}`);
    });
  });
});

// first clean the queue
Promise.all([
  viewsRefreshQueue.clean(0, 'active'),
  viewsRefreshQueue.clean(0, 'delayed'),
  viewsRefreshQueue.clean(0, 'wait'),
  viewsRefreshQueue.clean(0, 'completed'),
  viewsRefreshQueue.clean(0, 'failed'),
]).then(() => {
  // schedule - search all of the blocks for forks
  viewsRefreshQueue.add(
    {},
    { repeat: { cron: '*/10 * * * *' } } // At every 10 minutes.
  );
  // now
  viewsRefreshQueue.add();
});

setInterval(() => {
  viewsRefreshQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  viewsRefreshQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
