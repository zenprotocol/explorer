'use strict';

const dal = require('../../../lib/dal');

const contractTemplatesDAL = dal.createDAL('ContractTemplate');

contractTemplatesDAL.findBySlug = function(slug) {
  return this.findOne({
    where: {
      slug,
    }
  });
};

module.exports = contractTemplatesDAL;
