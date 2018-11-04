'use strict';

const path = require('path');
const Queue = require('bull');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('commands');
const slackLogger = require('../server/lib/slackLogger');

const commandsQueue = new Queue(
  Config.get('queues:commands:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
commandsQueue.process(path.join(__dirname, 'jobs/commands/commands.handler.js'));

// events
commandsQueue.on('error', function(error) {
  logger.error('A job error has occurred', error);
});

commandsQueue.on('active', function(job, jobPromise) {
  logger.info(`An job has started. ID=${job.id}`);
});

commandsQueue.on('completed', function(job, result) {
  logger.info(`An job has been completed. ID=${job.id} result=${result}`);
});

commandsQueue.on('failed', function(job, error) {
  logger.info(`An job has failed. ID=${job.id}, error=${error}`);
  taskTimeLimiter.executeTask(() => {
    slackLogger.error(`A Commands job has failed, error=${error}`);
  });
});

commandsQueue.on('cleaned', function(jobs, type) {
  logger.info('Jobs have been cleaned', { jobs, type });
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
