'use strict';

const dal = require('../common/dal');

const blocksDAL = dal.createDAL('Block');

module.exports = blocksDAL;