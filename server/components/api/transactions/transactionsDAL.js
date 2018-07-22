'use strict';

const deepMerge = require('deepmerge');
const dal = require('../../../lib/dal');
const transactionsDAL = dal.createDAL('Transaction');
const addressesDAL = require('../addresses/addressesDAL');
const blocksDAL = require('../blocks/blocksDAL');

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;

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

transactionsDAL.findAllByAddress = async function(
  address,
  firstTransactionId,
  ascending,
  options = { limit: 10 }
) {
  const addressDB = await addressesDAL.findByAddress(address);
  const whereOption = getFirstTransactionIdWhereOption(firstTransactionId, ascending);
  return addressDB.getTransactions(
    deepMerge.all([
      {
        include: [
          'Outputs',
          {
            model: this.db.Input,
            include: ['Output'],
          },
        ],
      },
      options,
      {
        where: whereOption,
        order: [[this.db.Input, 'index'], [this.db.Output, 'index']],
      },
    ])
  );
};

transactionsDAL.findAllByBlockNumber = async function(blockNumber, options = { limit: 10 }) {
  const blockDB = await blocksDAL.findByBlockNumber(blockNumber);
  return blockDB.getTransactions(
    deepMerge.all([
      {
        include: [
          'Outputs',
          {
            model: this.db.Input,
            include: ['Output'],
          },
        ],
      },
      options,
      {
        order: [[this.db.Input, 'index'], [this.db.Output, 'index']],
      },
    ])
  );
};

transactionsDAL.countByAddress = async function(address, firstTransactionId, ascending) {
  const whereOption = getFirstTransactionIdWhereOption(firstTransactionId, ascending);
  return this.count({
    where: whereOption,
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

transactionsDAL.countByBlockNumber = async function(blockNumber) {
  return this.count({
    include: [
      {
        model: this.db.Block,
        where: {
          blockNumber,
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

  return transaction.addAddress(addressDB, options);
};

function getFirstTransactionIdWhereOption(firstTransactionId, ascending) {
  const operator = ascending ? transactionsDAL.db.Sequelize.Op.gte : transactionsDAL.db.Sequelize.Op.lte;
  return firstTransactionId && Number(firstTransactionId) > 0
    ? {
        id: {
          [operator]: Number(firstTransactionId),
        },
      }
    : {};
}

module.exports = transactionsDAL;
