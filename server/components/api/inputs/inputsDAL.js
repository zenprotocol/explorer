'use strict';

const dal = require('../../../lib/dal');

const inputsDAL = dal.createDAL('Input');

inputsDAL.setOutput = async function(input, output) {
  return input.setOutput(output);
};
inputsDAL.setOutput = inputsDAL.setOutput.bind(inputsDAL);

module.exports = inputsDAL;