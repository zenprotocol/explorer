'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('votes');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');

const cgpWinnerQueue = queue(Config.get('queues:cgp-winner:name'));

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
cgpWinnerQueue.process(path.join(__dirname, 'jobs/votes/CGPWinnerCalculator/cgpWinner.handler.js'));

// events
cgpWinnerQueue.on('active', function(job) {
  logger.info('A job has started.');
});

cgpWinnerQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. result=${result}`);
});

cgpWinnerQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(`A CGP winner job has failed, error=${error.message} chain=${chain}`);
    });
  });
});

// first clean the queue
Promise.all([
  cgpWinnerQueue.clean(0, 'active'),
  cgpWinnerQueue.clean(0, 'delayed'),
  cgpWinnerQueue.clean(0, 'wait'),
  cgpWinnerQueue.clean(0, 'completed'),
  cgpWinnerQueue.clean(0, 'failed'),
]).then(() => {
  // once only, the votes queue will add jobs
  cgpWinnerQueue.add();
});

setInterval(() => {
  cgpWinnerQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  cgpWinnerQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
