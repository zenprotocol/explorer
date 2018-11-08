const ReorgProcessor = require('./ReorgProcessor');
const NetworkHelper = require('../../lib/NetworkHelper');
const reorgProcessor = new ReorgProcessor(new NetworkHelper());

module.exports = async function (job) {
  return await reorgProcessor.doJob(job);
};