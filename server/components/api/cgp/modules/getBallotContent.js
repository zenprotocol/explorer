'use strict';

const R = require('ramda');
const { Decimal } = require('decimal.js');
const BlockchainParser = require('../../../../lib/BlockchainParser');
const deserializeBallot = require('./deserializeBallot');

function getPayoutBallotContent({ ballot, chain } = {}) {
  const deserialized = deserializeBallot(ballot);
  if (!deserialized) return null;

  deserialized.spends = aggregatePayoutSpends(deserialized.spends);

  const blockchainParser = new BlockchainParser(chain);
  const address = R.has('contractId', deserialized.recipient)
    ? blockchainParser.getAddressFromContractId(deserialized.recipient.contractId)
    : blockchainParser.getPublicKeyHashAddress(deserialized.recipient.hash);
  return R.mergeDeepRight(deserialized, {
    recipient: {
      address,
    },
  });
}

/**
 * Aggregate all spends with same asset
 * @param {Array} spends 
 */
function aggregatePayoutSpends(spends) {
  const aggregated = (spends || []).reduce((aggregated, cur) => {
    aggregated[cur.asset] = new Decimal(aggregated[cur.asset] || 0).plus(cur.amount);
    return aggregated;
  }, {});
  return Object.keys(aggregated).map(key => ({
    asset: key,
    amount: aggregated[key].toString(),
  }));
}

function getAllocationBallotContent({ ballot } = {}) {
  const deserialized = deserializeBallot(ballot);
  if (!deserialized) return null;

  return deserialized;
}

module.exports = {
  getPayoutBallotContent,
  getAllocationBallotContent,
};
