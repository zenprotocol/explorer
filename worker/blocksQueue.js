'use strict';

const path = require('path');
const queue = require('./lib/queue');
const TaskTimeLimiter = require('./lib/TaskTimeLimiter');
const Config = require('../server/config/Config');
const makeLogger = require('./lib/logger');
const loggerBlocks = makeLogger('blocks');
const loggerReorg = makeLogger('reorg');
const slackLogger = require('../server/lib/slackLogger');
const getChain = require('../server/lib/getChain');
const NUM_OF_BLOCKS_IN_CHUNK = Config.get('queues:addBlocks:limitBlocks');

const NODE_URL = Config.get('zp:node');
const APP_NAME = Config.get('APP_NAME');
const addBlocksQueue = queue(Config.get('queues:addBlocks:name'));
const reorgsQueue = queue(Config.get('queues:reorgs:name'));
const snapshotsQueue = queue(Config.get('queues:snapshots:name'));
const commandsQueue = queue(Config.get('queues:commands:name'));

const taskTimeLimiter = new TaskTimeLimiter(Config.get('queues:slackTimeLimit') * 1000);

// process ---
addBlocksQueue.process(path.join(__dirname, 'jobs/blocks/addNewBlocks.handler.js'));
reorgsQueue.process(path.join(__dirname, 'jobs/blocks/reorgs.handler.js'));


// events
addBlocksQueue.on('active', function(job, jobPromise) {
  loggerBlocks.info(`A job has started. ID=${job.id} TYPE=${job.data.type}`);
});

addBlocksQueue.on('completed', function(job, result) {
  if (job.data.type === 'check-synced') {
    loggerBlocks.info(
      `A job has been completed. ID=${job.id} TYPE=${job.data.type} result=${result}`
    );
  } else {
    loggerBlocks.info(
      `A job has been completed. ID=${job.id} TYPE=${job.data.type} count=${result.count} latest block added=${result.latest}`
    );
    if (result.count > 0) {
      addBlocksQueue.add({ type: 'add-blocks', limitBlocks: NUM_OF_BLOCKS_IN_CHUNK });
      // notify other queues that blocks were added
      snapshotsQueue.add();
      commandsQueue.add();
    }
  }
});

addBlocksQueue.on('failed', function(job, error) {
  loggerBlocks.error(`A job has failed. ID=${job.id} TYPE=${job.data.type} error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    getChain().then(chain => {
      slackLogger.error(
        `A ${job.data.type} job has failed, error=${error.message} app=${APP_NAME} chain=${chain} node=${NODE_URL}`
      );
    });
  });
  if (error.message === 'Reorg') {
    const message = 'Found a reorg! starting the reorg processor...';
    loggerBlocks.info(message);
    slackLogger.log(`${message} app=${APP_NAME} node=${NODE_URL}`);
    addBlocksQueue.pause();
    reorgsQueue.add();
  }
});

reorgsQueue.on('active', function(job, jobPromise) {
  loggerReorg.info('A search one and delete job has started.');
});

reorgsQueue.on('completed', function(job, result) {
  if (result.deleted > 0) {
    const message = `A reorg was successfully handled: ${JSON.stringify(result)}`;
    loggerReorg.info(message);
    slackLogger.log(`${message} app=${APP_NAME} node=${NODE_URL}`);
    addBlocksQueue.resume();
  } else {
    const message = `Could not handle a reorg: ${JSON.stringify(result)}`;
    loggerReorg.error(message);
    slackLogger.log(`${message} app=${APP_NAME} node=${NODE_URL}`);
  }
});

reorgsQueue.on('failed', function(job, error) {
  loggerReorg.error(`A job has failed. ID=${job.id}, error=${error.message}`);
  taskTimeLimiter.executeTask(() => {
    slackLogger.error(
      `An reorgsQueue job has failed, error=${error.message} app=${APP_NAME} node=${NODE_URL}`
    );
  });
});

// first clean the queue
Promise.all([
  addBlocksQueue.clean(0, 'active'),
  addBlocksQueue.clean(0, 'delayed'),
  addBlocksQueue.clean(0, 'wait'),
  addBlocksQueue.clean(0, 'completed'),
  addBlocksQueue.clean(0, 'failed'),
  reorgsQueue.clean(0, 'active'),
  reorgsQueue.clean(0, 'delayed'),
  reorgsQueue.clean(0, 'wait'),
  reorgsQueue.clean(0, 'completed'),
  reorgsQueue.clean(0, 'failed'),
]).then(() => {
  // schedule ---
  addBlocksQueue.add(
    { type: 'add-blocks', limitBlocks: NUM_OF_BLOCKS_IN_CHUNK },
    { repeat: { cron: '* * * * *' } }
  );
  addBlocksQueue.add({ type: 'check-synced' }, { repeat: { cron: '*/30 * * * *' } });
  // now
  addBlocksQueue.add({ type: 'add-blocks', limitBlocks: NUM_OF_BLOCKS_IN_CHUNK });
  addBlocksQueue.add({ type: 'check-synced' });
  addBlocksQueue.resume();
});

setInterval(() => {
  addBlocksQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  addBlocksQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
  reorgsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'completed');
  reorgsQueue.clean(Config.get('queues:cleanAfter') * 1000, 'failed');
}, Config.get('queues:cleanInterval') * 1000);
