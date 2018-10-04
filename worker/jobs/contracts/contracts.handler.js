const ContractsAdder = require('./ContractsAdder');
const NetworkHelper = require('../../lib/NetworkHelper');
const contractsAdder = new ContractsAdder(new NetworkHelper());

module.exports = async function (job) {
  return await contractsAdder.doJob(job);
};