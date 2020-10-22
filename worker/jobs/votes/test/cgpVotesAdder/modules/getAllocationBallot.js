'use strict';

const { Allocation, Ballot } = require('@zen/zenjs');

module.exports = function (allocation) {
  return new Ballot(new Allocation(allocation)).toHex();
};
