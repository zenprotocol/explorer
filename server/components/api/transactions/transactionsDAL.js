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

transactionsDAL.findAllByAddress = async function(address, asset) {
  return this.findAll({
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
          address
        },
        through: {
          where: {asset}
        }
      },
    ],
    // limit: 10,
    // order: [
    //   [this.db.Sequelize.col('Block.timestamp'), 'DESC'],
    //   [this.db.Input, 'index'], [this.db.Output, 'index']
    // ],
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
 * @param {string} type input/output
 * @param {Object} [options={}]
 */
transactionsDAL.addAddress = async function(transaction, address, type, asset, options = {}) {
  let addressDB = null;
  if (typeof address === 'string') {
    addressDB = await addressesDAL.findByAddress(address);
    if (!addressDB) {
      addressDB = await addressesDAL.create({ address }, options);
    }
  } else {
    addressDB = address;
  }

  // allow only one combination of transactionId|addressId|type
  const addresses = await transaction.getAddresses({
    where: {
      id: addressDB.id,
    },
    through: {
      where: {
        type,
        asset,
      },
    },
  });
  if (addresses.length > 0) {
    console.log(
      'THIS TRANSACTION HAS THE ADDRESS ALREADY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
      { transactionId: transaction.id, addressId: addressDB.id, type }
    );
  }
  if (!addresses.length) {
    return transaction.addAddress(addressDB, Object.assign({ through: { type, asset } }, options));
  }

  return Promise.resolve(0);
};

module.exports = transactionsDAL;
