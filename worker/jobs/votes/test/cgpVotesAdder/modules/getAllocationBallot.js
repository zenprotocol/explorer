'use strict';

const { Allocation } = require('@zen/zenjs/build/src/Consensus/Types/Allocation');
const { Ballot } = require('@zen/zenjs/build/src/Consensus/Types/Ballot');

module.exports = function(allocation) {
  return new Ballot(new Allocation(allocation)).toHex();
};
