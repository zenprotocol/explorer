const BlocksAdder = require('./BlocksAdder');
const NetworkHelper = require('../../lib/NetworkHelper');
const blocksAdder = new BlocksAdder(new NetworkHelper());

module.exports = async function (job) {
  return await blocksAdder.addNewBlocks(job);
};