'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('executions');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');

const NODE_URL = Config.get('zp:node');
const APP_NAME = Config.get('APP_NAME');
const executionsQueue = queue(Config.get('queues:executions:name'));
// notify the votes queue whenever new executions were added
const votesQueue = queue(Config.get('queues:votes:name'));

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
executionsQueue.process(path.join(__dirname, 'jobs/executions/executions.handler.js'));

// events
executionsQueue.on('active', function (job) {
  logger.info(`A job has started. ID=${job.id}`);
});

executionsQueue.on('completed', function (job, result) {
  logger.info(`A job has been completed. ID=${job.id} type=${job.data.type} result=${result}`);
  if (result > 0) {
    votesQueue.add({ type: 'cgp' });
    votesQueue.add({ type: 'repo' });
  }
});

executionsQueue.on('failed', function (job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then((chain) => {
      slackLogger.error(
        `An Executions job has failed, error=${error.message} app=${APP_NAME} chain=${chain} node=${NODE_URL}`
      );
    });
  });
});

// first clean the queue
Promise.all([
  executionsQueue.clean(0, 'active'),
  executionsQueue.clean(0, 'delayed'),
  executionsQueue.clean(0, 'wait'),
  executionsQueue.clean(0, 'completed'),
  executionsQueue.clean(0, 'failed'),
]).then(() => {
  // now
  executionsQueue.add({ type: 'expensive' });

  // schedule expensive job, the rapid jobs will be queued after each blocks queue job
  executionsQueue.add(
    { type: 'expensive' },
    { repeat: { cron: '0 */12 * * *' } } // At minute 0 past every 12th hour.
  );
});

setInterval(() => {
  executionsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  executionsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
