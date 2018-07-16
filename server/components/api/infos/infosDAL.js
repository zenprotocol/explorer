'use strict';

const dal = require('../../../lib/dal');

const infosDAL = dal.createDAL('Info');

infosDAL.findByName = function(name) {
  return this.findOne({
    where: {
      name
    },
  });
};

module.exports = infosDAL;
