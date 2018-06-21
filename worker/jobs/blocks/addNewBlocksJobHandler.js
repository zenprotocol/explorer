'use strict';

const addNewBlocks = require('./addNewBlocks');

module.exports = async function jobHandler() {
  return await addNewBlocks();
};

