const NetworkHelper = require('../../lib/NetworkHelper');
const InfosAdder = require('./InfosAdder');
const infosAdder = new InfosAdder(new NetworkHelper());

module.exports = async function (job) {
  return await infosAdder.doJob(job);
};