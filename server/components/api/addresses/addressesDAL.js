'use strict';

const dal = require('../../../lib/dal');

const addressesDAL = dal.createDAL('Address');

addressesDAL.findByAddress = function(address) {
  return this.findOne({
    where: {
      address,
    },
  });
};

addressesDAL.findAllTransactions = async function(address, options = {limit: 10}) {
  const addressDB = await this.findByAddress(address);
  return addressDB.getTransactions(
    Object.assign(
      {
        include: [
          'Block',
          'Outputs',
          {
            model: this.db.Input,
            include: ['Output'],
          },
        ],
        order: [['createdAt', 'DESC'], [this.db.Input, 'index'], [this.db.Output, 'index']],
      },
      options
    )
  );
};

/**
 * Add a transaction to an address
 *
 * @param {Object} address
 * @param {Object} transaction
 * @param {Object} [options={}]
 */
addressesDAL.addTransaction = async function(address, transaction, options = {}) {
  return address.addTransaction(transaction, options);
};

module.exports = addressesDAL;
