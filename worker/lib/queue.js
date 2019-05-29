const Config = require('../../server/config/Config');
const Redis = require('ioredis');
const BullQueue = require('bull');
const client = ConnectionsCycleIterator(4);
const subscriber = ConnectionsCycleIterator(4);

const bullQueueOptions = {
  createClient: function(type) {
    switch (type) {
      case 'client':
        return client.next();
      case 'subscriber':
        return subscriber.next();
      default:
        return new Redis(Config.any(['REDISCLOUD_URL', 'redis']));
    }
  },
};

/**
 * Get a new queue with the specified name
 *
 * @param {string} name the queue name
 * @returns a queue
 */
function queue(name) {
  return new BullQueue(name, bullQueueOptions);
}

module.exports = queue;

/**
 * Reuses the same redis connections in a cycle
 *
 * @param {number} numOfConnections
 */
function ConnectionsCycleIterator(numOfConnections) {
  const connections = new Array(numOfConnections).fill(1).map(() => getNewRedis());
  let index = -1;

  function next() {
    index = index + 1;
    if (index === connections.length) {
      index = 0;
    }
    return connections[index];
  }

  return Object.freeze({ next });
}

function getNewRedis() {
  return new Redis(Config.any(['REDISCLOUD_URL', 'redis']));
}