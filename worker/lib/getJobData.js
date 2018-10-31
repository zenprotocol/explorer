/**
 * Get a key from the job data object
 *
 * @param {Object} job
 * @param {String} key
 * @returns the key or null
 */
function getJobData(job, key) {
  return ((job || {}).data || {})[key];
}

module.exports = getJobData;
