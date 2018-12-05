'use strict';

const path = require('path');
const Queue = require('bull');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('contracts');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('./lib/getChain');

const contractsQueue = new Queue(
  Config.get('queues:contracts:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
contractsQueue.process(path.join(__dirname, 'jobs/contracts/contracts.handler.js'));

// events
contractsQueue.on('active', function(job, jobPromise) {
  logger.info(`A job has started. ID=${job.id}`);
});

contractsQueue.on('completed', function(job, result) {
  logger.info(`A job has been completed. ID=${job.id} result=${result}`);
});

contractsQueue.on('failed', function(job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(`A Contracts job has failed, error=${error.message} chain=${chain}`);
    });
  });
});

// first clean the queue
Promise.all([
  contractsQueue.clean(0, 'active'),
  contractsQueue.clean(0, 'delayed'),
  contractsQueue.clean(0, 'wait'),
  contractsQueue.clean(0, 'completed'),
  contractsQueue.clean(0, 'failed'),
]).then(() => {
  // schedule ---
  contractsQueue.add(
    {},
    { repeat: { cron: '* * * * *' } }
  );
  // now
  contractsQueue.add({});
});

setInterval(() => {
  contractsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  contractsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
