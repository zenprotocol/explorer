'use strict';

/**
 * Currently worker is responsible for scheduling and work
 * if more jobs should be added, consider scheduling on a different file
 */

const path = require('path');
const Queue = require('bull');
const Config = require('../server/config/Config');
const logger = require('./lib/logger');

const addBlocksQueue = new Queue(
  Config.get('queues:addBlocks:name'),
  Config.any(['REDISCLOUD_URL', 'redis'])
);

// process ---
addBlocksQueue.process(path.join(__dirname, 'jobs/blocks/addNewBlocks.handler.js'));

// events
addBlocksQueue.on('error', function(error) {
  logger.error('A job error has occurred', error);
});

addBlocksQueue.on('active', function(job, jobPromise){
  logger.info(`An AddBlocksQueue job has started. ID=${job.id}`);
});

addBlocksQueue.on('completed', function(job, result){
  logger.info(`An AddBlocksQueue job has been completed. ID=${job.id} result=${result}`);
});

addBlocksQueue.on('failed', function(job, error){
  logger.info(`An AddBlocksQueue job has failed. ID=${job.id}, error=${error}`);
});

addBlocksQueue.on('cleaned', function(jobs, type) {
  logger.info('Jobs have been cleaned', {jobs, type});
});

// schedule ---
addBlocksQueue.add({limitBlocks: 200}, { repeat: { cron: '* * * * *' } });

setInterval(() => {
  addBlocksQueue.clean(Config.get('queues:addBlocks:cleanAfter') * 1000, 'completed');
  addBlocksQueue.clean(Config.get('queues:addBlocks:cleanAfter') * 1000, 'failed');
}, Config.get('queues:addBlocks:cleanInterval') * 1000);
