const axios = require('axios');
const Config = require('../config/Config');
const logger = require('../lib/logger');

let data = null;
let lastFetchTime = null;
const FETCH_GAP_TIME = 12 * 60 * 60 * 1000; // 12 hours
const TRY_REFETCH_EVERY = 20 * 60 * 1000; // 20 minutes

/**
 * Get a name by contract ID
 * @param {string} id
 *
 * @returns {{name: string, shortName: string}}
 */
module.exports = function get(id) {
  if (!data) {
    fetchJson();
    lastFetchTime = Date.now();
    return '';
  }
  return data[id];
};

async function fetchJson() {
  try {
    logger.info('try fetch naming json...');
    const result = await axios.default.get(Config.get('CONTRACT_NAMING_JSON'), { timeout: 10000 });
    if(result.status === 200) {
      logger.info('fetched naming json successfully');
      // convert to a hash table
      data = result.data.items.reduce((hash, item) => {
        return Object.assign(hash, item);
      }, {});
    }
  } catch (error) {
    // ignore
  }
}

// fetch on init
lastFetchTime = Date.now();
fetchJson();

// fetch periodically
function refetch() {
  if(Date.now() - lastFetchTime > FETCH_GAP_TIME) {
    lastFetchTime = Date.now();
    fetchJson();
  }
  setTimeout(refetch, TRY_REFETCH_EVERY);
}
refetch();
