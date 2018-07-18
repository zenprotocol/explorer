'use strict';

const dal = require('../../../lib/dal');
const transactionsDAL = dal.createDAL('Transaction');
const addressesDAL = require('../addresses/addressesDAL');
const blocksDAL = require('../blocks/blocksDAL');

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

transactionsDAL.findAllByAddress = async function(address, firstTransactionId, options = { limit: 10 }) {
  const addressDB = await addressesDAL.findByAddress(address);
  const whereOption = getFirstTransactionIdWhereOption(firstTransactionId);
  return addressDB.getTransactions(
    Object.assign(
      {
        include: [
          'Outputs',
          {
            model: this.db.Input,
            include: ['Output'],
          },
        ],
        order: [['createdAt', 'DESC'], [this.db.Input, 'index'], [this.db.Output, 'index']],
      },
      options,
      {
        where: whereOption,
      }
    )
  );
};

transactionsDAL.findAllByBlockNumber = async function(blockNumber, options = { limit: 10 }) {
  const blockDB = await blocksDAL.findByBlockNumber(blockNumber);
  return blockDB.getTransactions(
    Object.assign(
      {
        include: [
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

transactionsDAL.countByAddress = async function(address, firstTransactionId) {
  const whereOption = getFirstTransactionIdWhereOption(firstTransactionId);
  return this.count({
    include: [
      {
        model: this.db.Address,
        where: Object.assign(
          {
            address,
          },
          whereOption
        ),
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

function getFirstTransactionIdWhereOption(firstTransactionId) {
  return firstTransactionId && Number(firstTransactionId) > 0
    ? {
        id: {
          [transactionsDAL.db.Sequelize.Op.lte]: Number(firstTransactionId),
        },
      }
    : {};
}

module.exports = transactionsDAL;
