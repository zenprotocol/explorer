'use strict';

const dal = require('../../../lib/dal');

const addressesDAL = dal.createDAL('Address');

addressesDAL.findByAddress = function(address) {
  return this.findOne({
    where: {
      address
    },
  });
};

/**
 * Add a transaction to an address
 *
 * @param {Object} address
 * @param {Object} transaction
 * @param {string} type input/output
 * @param {Object} [options={}]
 */
addressesDAL.addTransaction = async function(address, transaction, type, asset, options = {}) {
  return address.addTransaction(transaction, Object.assign({ through: { type, asset }}, options));
};

module.exports = addressesDAL;
