const ExecutionsAdder = require('./ExecutionsAdder');
const NetworkHelper = require('../../lib/NetworkHelper');
const executionsAdder = new ExecutionsAdder(new NetworkHelper());

module.exports = async function (job) {
  return await executionsAdder.doJob(job);
};