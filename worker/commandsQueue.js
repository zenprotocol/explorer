'use strict';

const path = require('path');
const Queue = require('bull');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('commands');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('./lib/getChain');

const commandsQueue = new Queue(
  Config.get('queues:commands:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
commandsQueue.process(path.join(__dirname, 'jobs/commands/commands.handler.js'));

// events
commandsQueue.on('active', function(job, jobPromise) {
  logger.info(`A job has started. ID=${job.id}`);
});

commandsQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. ID=${job.id} result=${result}`);
});

commandsQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(`A Commands job has failed, error=${error.message} chain=${chain}`);
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
  // schedule ---
  commandsQueue.add(
    {},
    { repeat: { cron: '* * * * *' } }
  );
  // now
  commandsQueue.add({});
});

setInterval(() => {
  commandsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  commandsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
