'use strict';

const dal = require('../../../lib/dal');

const votesDAL = dal.createDAL('Vote');

module.exports = votesDAL;
