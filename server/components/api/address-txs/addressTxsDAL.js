'use strict';

const dal = require('../../../lib/dal');

const addressTxsDAL = dal.createDAL('AddressTx');

addressTxsDAL.countByAddress = function (address, options) {
  return this.count({
    where: {
      address,
    },
    ...options,
  });
};

module.exports = addressTxsDAL;
