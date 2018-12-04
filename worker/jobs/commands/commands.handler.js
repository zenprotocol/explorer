const CommandsAdder = require('./CommandsAdder');
const NetworkHelper = require('../../lib/NetworkHelper');
const commandsAdder = new CommandsAdder(new NetworkHelper());

module.exports = async function (job) {
  return await commandsAdder.doJob(job);
};