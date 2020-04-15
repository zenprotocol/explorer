'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('commands');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');

const NODE_URL = Config.get('zp:node');
const APP_NAME = Config.get('APP_NAME');
const commandsQueue = queue(Config.get('queues:commands:name'));
// notify the votes queue whenever new commands were added
const votesQueue = queue(Config.get('queues:votes:name'));

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
commandsQueue.process(path.join(__dirname, 'jobs/commands/commands.handler.js'));

// events
commandsQueue.on('active', function(job, jobPromise) {
  logger.info(`A job has started. ID=${job.id}`);
});

commandsQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. ID=${job.id} result=${result}`);
  if (result > 0) {
    votesQueue.add({ type: 'cgp' });
    votesQueue.add({ type: 'repo' });
  }
});

commandsQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(
        `A Commands job has failed, error=${error.message} app=${APP_NAME} chain=${chain} node=${NODE_URL}`
      );
    });
  });
});

// first clean the queue
Promise.all([
  commandsQueue.clean(0, 'active'),
  commandsQueue.clean(0, 'delayed'),
  commandsQueue.clean(0, 'wait'),
  commandsQueue.clean(0, 'completed'),
  commandsQueue.clean(0, 'failed'),
]).then(() => {
  // now
  commandsQueue.add({});
});

setInterval(() => {
  commandsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  commandsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
