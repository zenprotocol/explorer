'use strict';

const dal = require('../../../lib/dal');

const assetTxsDAL = dal.createDAL('AssetTx');

module.exports = assetTxsDAL;
