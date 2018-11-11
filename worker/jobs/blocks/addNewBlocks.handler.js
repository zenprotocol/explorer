const BlocksAdder = require('./BlocksAdder');
const NetworkHelper = require('../../lib/NetworkHelper');
const BlockchainParser = require('../../../server/lib/BlockchainParser');
const blocksAdder = new BlocksAdder(new NetworkHelper(), new BlockchainParser());

module.exports = async function (job) {
  return await blocksAdder.addNewBlocks(job);
};