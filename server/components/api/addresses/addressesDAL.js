'use strict';

const deepMerge = require('deepmerge');
const dal = require('../../../lib/dal');
const addressesDAL = dal.createDAL('Address');

addressesDAL.findByAddress = function(address, { transaction } = {}) {
  const options = {
    where: {
      address,
    },
  };

  if(transaction) {
    options.transaction = transaction;
  }

  return this.findOne(options);
};

addressesDAL.getSentSums = async function(address) {
  const db = this.db;
  const Sequelize = db.Sequelize;
  return db.Input.findAll({
    attributes: ['Output.asset', [Sequelize.fn('sum', Sequelize.col('Output.amount')), 'total']],
    include: [
      {
        model: db.Output,
        where: {
          address,
        },
        attributes: [],
      },
    ],
    group: Sequelize.col('Output.asset'),
    raw: true,
  });
};
addressesDAL.getReceivedSums = async function(address) {
  const db = this.db;
  const Sequelize = db.Sequelize;
  return db.Output.findAll({
    attributes: ['asset', [Sequelize.fn('sum', Sequelize.col('amount')), 'total']],
    where: {
      address,
    },
    group: 'asset',
    raw: true,
  });
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
