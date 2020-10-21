'use strict';

const dal = require('../../../lib/dal');

const inputsDAL = dal.createDAL('Input');

inputsDAL.setOutput = async function(input, output, options = {}) {
  return input.setOutput(output, options);
};

module.exports = inputsDAL;
