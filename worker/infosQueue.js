'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const logger = require('./lib/logger')('infos');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');

const NODE_URL = Config.get('zp:node');
const APP_NAME = Config.get('APP_NAME');
const updateGeneralInfosQueue = queue(Config.get('queues:updateGeneralInfos:name'));

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
updateGeneralInfosQueue.process(path.join(__dirname, 'jobs/infos/updateGeneralInfos.handler.js'));

// events
updateGeneralInfosQueue.on('active', function (job) {
  logger.info(`A job has started. ID=${job.id}`);
});

updateGeneralInfosQueue.on('completed', function (job, result) {
  logger.info(`A job has been completed. ID=${job.id} result=${JSON.stringify(result, null, 2)}`);
});

updateGeneralInfosQueue.on('failed', function (job, error) {
  logger.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then((chain) => {
      slackLogger.error(
        `An UpdateGeneralInfos job has failed, error=${error.message} app=${APP_NAME} chain=${chain} node=${NODE_URL}`
      );
    });
  });
});

// first clean the queue
Promise.all([
  updateGeneralInfosQueue.clean(0, 'active'),
  updateGeneralInfosQueue.clean(0, 'delayed'),
  updateGeneralInfosQueue.clean(0, 'wait'),
  updateGeneralInfosQueue.clean(0, 'completed'),
  updateGeneralInfosQueue.clean(0, 'failed'),
]).then(() => {
  // schedule ---
  updateGeneralInfosQueue.add(
    {},
    { repeat: { cron: '0 1 * * *' } } // once a day at 1:00
  );
  // now
  updateGeneralInfosQueue.add();
});

setInterval(() => {
  updateGeneralInfosQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  updateGeneralInfosQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
