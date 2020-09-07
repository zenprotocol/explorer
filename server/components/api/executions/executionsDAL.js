'use strict';

const dal = require('../../../lib/dal');

const executionsDAL = dal.createDAL('Execution');

module.exports = executionsDAL;
