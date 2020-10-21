'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('votes');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');

const NODE_URL = Config.get('zp:node');
const APP_NAME = Config.get('APP_NAME');
const votesQueue = queue(Config.get('queues:votes:name'));

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
votesQueue.process(path.join(__dirname, 'jobs/votes/votes.handler.js'));

// events
votesQueue.on('active', function(job) {
  logger.info(`A job has started.  TYPE=${job.data.type}`);
});

votesQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. TYPE=${job.data.type} result=${result}`);
});

votesQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. TYPE=${job.data.type}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(`A Votes job has failed, error=${error.message} app=${APP_NAME} chain=${chain} node=${NODE_URL}`);
    });
  });
});

// first clean the queue
Promise.all([
  votesQueue.clean(0, 'active'),
  votesQueue.clean(0, 'delayed'),
  votesQueue.clean(0, 'wait'),
  votesQueue.clean(0, 'completed'),
  votesQueue.clean(0, 'failed'),
]).then(() => {
  // once only, for future executions, the executions queue will add jobs
  votesQueue.add({type: 'cgp'});
  votesQueue.add({type: 'repo'});
});

setInterval(() => {
  votesQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  votesQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
