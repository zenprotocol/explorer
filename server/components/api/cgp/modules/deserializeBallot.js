'use strict';

const { Ballot } = require('@zen/zenjs/build/src/Consensus/Types/Ballot');

module.exports = function(ballot) {
  try {
    const data = Ballot.fromHex(ballot).getData().toJson();
    return data;
  } catch (error) {
    return null;
  }
}