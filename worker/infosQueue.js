'use strict';

const path = require('path');
const Queue = require('bull');
const Config = require('../server/config/Config');
const logger = require('./lib/logger');

const updateGeneralInfosQueue = new Queue(
  Config.get('queues:updateGeneralInfos:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);
// process ---
updateGeneralInfosQueue.process(path.join(__dirname, 'jobs/infos/updateGeneralInfos.handler.js'));

// events
updateGeneralInfosQueue.on('error', function(error) {
  logger.error('A UpdateGeneralInfosQueue job error has occurred', error);
});

updateGeneralInfosQueue.on('active', function(job, jobPromise) {
  logger.info(`An UpdateGeneralInfosQueue job has started. ID=${job.id}`);
});

updateGeneralInfosQueue.on('completed', function(job, result) {
  logger.info(`An UpdateGeneralInfosQueue job has been completed. ID=${job.id} result=${result}`);
});

updateGeneralInfosQueue.on('failed', function(job, error) {
  logger.info(`An UpdateGeneralInfosQueue job has failed. ID=${job.id}, error=${error}`);
});

updateGeneralInfosQueue.on('cleaned', function(jobs, type) {
  logger.info('Jobs have been cleaned', { jobs, type });
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
  updateGeneralInfosQueue.add({});
});

setInterval(() => {
  updateGeneralInfosQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  updateGeneralInfosQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
