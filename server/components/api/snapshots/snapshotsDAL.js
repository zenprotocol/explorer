'use strict';

const dal = require('../../../lib/dal');

const snapshotsDAL = dal.createDAL('Snapshot');

/**
 * Checks if a snapshot exists for a given block number
 * @param {number} blockNumber 
 */
snapshotsDAL.exists = async function(blockNumber) {
  return this.findOne({
    where: {
      blockNumber
    },
  }).then(item => !!item);
};

/**
 * Checks if an address has balance at the given snapshot
 * @param {number} blockNumber 
 * @param {string} address
 */
snapshotsDAL.addressHasBalance = async function(blockNumber, address) {
  return this.findOne({
    where: {
      address,
      blockNumber
    },
  }).then(item => !!item);
};

snapshotsDAL.findAllHeights = async function() {
  return this.findAll({
    attributes: ['blockNumber'],
    group: ['blockNumber'],
    order: [['blockNumber', 'ASC']],
  }).then(results => {
    // return the heights without a wrapping object
    return results.map(item => item.blockNumber);
  });
};

module.exports = snapshotsDAL;
