'use strict';

const dal = require('../../../lib/dal');
const transactionsDAL = dal.createDAL('Transaction');
const addressesDAL = require('../addresses/addressesDAL');

transactionsDAL.findByHash = async function(hash) {
  return transactionsDAL.findOne({
    where: {
      hash,
    },
    include: [
      {
        model: this.db.Block,
      },
      'Outputs',
      {
        model: this.db.Input,
        include: ['Output'],
      },
    ],
    order: [[transactionsDAL.db.Input, 'index'], [transactionsDAL.db.Output, 'index']],
  });
};

// Slow - use addressesDAL findAllTransactions
transactionsDAL.findAllByAddress = async function(address, options = {}) {
  return this.findAll(
    Object.assign(
      {
        include: [
          {
            model: this.db.Block,
          },
          'Outputs',
          {
            model: this.db.Input,
            include: ['Output'],
          },
          {
            model: this.db.Address,
            where: {
              address,
            },
          },
        ],
        order: [['createdAt', 'DESC'], [this.db.Input, 'index'], [this.db.Output, 'index']],
        limit: 2,
      },
      options
    )
  );
};

transactionsDAL.countByAddress = async function(address) {
  return this.count({
    include: [
      {
        model: this.db.Address,
        where: {
          address,
        },
      },
    ],
  });
};

transactionsDAL.addInput = async function(transaction, input, options = {}) {
  return transaction.addInput(input, options);
};
transactionsDAL.addInput = transactionsDAL.addInput.bind(transactionsDAL);

transactionsDAL.addOutput = async function(transaction, output, options = {}) {
  return transaction.addOutput(output, options);
};
transactionsDAL.addOutput = transactionsDAL.addOutput.bind(transactionsDAL);

/**
 * Add an address to a transaction
 *
 * @param {Object} transaction
 * @param {Object|string} address
 * @param {Object} [options={}]
 */
transactionsDAL.addAddress = async function(transaction, address, options = {}) {
  let addressDB = null;
  if (typeof address === 'string') {
    addressDB = await addressesDAL.findByAddress(address);
    if (!addressDB) {
      addressDB = await addressesDAL.create({ address }, options);
    }
  } else {
    addressDB = address;
  }

  // allow only one relation
  const addresses = await transaction.getAddresses({
    where: {
      id: addressDB.id,
    },
  });

  return transaction.addAddress(addressDB, options);
};

module.exports = transactionsDAL;
