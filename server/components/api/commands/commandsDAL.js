'use strict';

const dal = require('../../../lib/dal');

const commandsDAL = dal.createDAL('Command');

commandsDAL.bulkCreate = function(items) {
  return this.db.Command.bulkCreate(items);
};

module.exports = commandsDAL;
