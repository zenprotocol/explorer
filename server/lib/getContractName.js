const axios = require('axios');
const Config = require('../config/Config');

let data = null;

/**
 * Get a name by contract ID
 * @param {string} id
 *
 * @returns {string}
 */
module.exports = function get(id) {
  if (!data) {
    fetchJson();
    return '';
  }
  return data[id];
};

async function fetchJson() {
  try {
    const result = await axios.default.get(Config.get('CONTRACT_NAMING_JSON'), { timeout: 10000 });
    if(result.status === 200) {
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
fetchJson();
