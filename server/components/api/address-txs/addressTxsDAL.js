'use strict';

const dal = require('../../../lib/dal');

const addressTxsDAL = dal.createDAL('AddressTx');

module.exports = addressTxsDAL;
