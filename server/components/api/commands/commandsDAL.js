'use strict';

const dal = require('../../../lib/dal');

const commandsDAL = dal.createDAL('Command');

module.exports = commandsDAL;
