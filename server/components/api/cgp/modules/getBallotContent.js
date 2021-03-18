'use strict';

const R = require('ramda');
const BlockchainParser = require('../../../../lib/BlockchainParser');
const getAssetName = require('../../../../lib/getAssetName');
const deserializeBallot = require('./deserializeBallot');

function getPayoutBallotContent({ ballot, chain } = {}) {
  const deserialized = deserializeBallot(ballot);
  if (!deserialized) return null;

  const spends =
    (deserialized.spends || []).map((data) => {
      return {
        ...data,
        metadata: getAssetName(data.asset),
      }
    })
  if (!!deserialized.spends) deserialized.spends = spends
  
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

function getAllocationBallotContent({ ballot } = {}) {
  const deserialized = deserializeBallot(ballot);
  if (!deserialized) return null;

  return deserialized;
}

module.exports = {
  getPayoutBallotContent,
  getAllocationBallotContent,
};
