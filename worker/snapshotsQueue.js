'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('snapshots');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');

const NODE_URL = Config.get('zp:node');
const APP_NAME = Config.get('APP_NAME');
const snapshotsQueue = queue(Config.get('queues:snapshots:name'));

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
snapshotsQueue.process(path.join(__dirname, 'jobs/snapshots/snapshots.handler.js'));

// events
snapshotsQueue.on('active', function(job, jobPromise) {
  logger.info(`A job has started. ID=${job.id}`);
});

snapshotsQueue.on('completed', function(job, result) {
  logger.info(
    `A job has been completed. Processed VoteIntervals: ${result.voteIntervals.length}. Processed CGP intervals: ${result.cgp.length}.`
  );
});

snapshotsQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(`A snapshots job has failed, error=${error.message} app=${APP_NAME} chain=${chain} node=${NODE_URL}`);
    });
  });
});

setInterval(() => {
  snapshotsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  snapshotsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
