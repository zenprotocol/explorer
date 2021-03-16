const axios = require('axios');
const Config = require('../config/Config');
const logger = require('../lib/logger');

let data = null;
let lastFetchTime = null;
const FETCH_GAP_TIME =  20 * 60 * 1000; // 20 minutes
const TRY_REFETCH_EVERY = 5 * 60 * 1000; // 5 minutes

/**
 * Get a name by contract ID
 * @param {string} asset
 *
 * @returns {{name: string, shortName: string}}
 */
module.exports = function get(asset) {
  if (!data) {
    fetchJson();
    lastFetchTime = Date.now();
    return '';
  }
  return data[asset];
};

async function fetchJson() {
  try {
    logger.info(' try fetch asset naming json...');
    const result = await axios.default.get(Config.get('ASSET_NAMING_JSON'), { timeout: 10000 });
    if(result.status === 200) {
      logger.info('fetched asset naming json successfully');
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
