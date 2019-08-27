'use strict';

const truncate = require('./truncate');

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

module.exports = wrapTest;
