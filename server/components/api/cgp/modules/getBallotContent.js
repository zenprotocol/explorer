'use strict';

const R = require('ramda');
const BlockchainParser = require('../../../../lib/BlockchainParser');
const getChain = require('../../../../lib/getChain');
const deserializeBallot = require('./deserializeBallot');

async function getPayoutBallotContent({ ballot } = {}) {
  const deserialized = deserializeBallot(ballot);
  if (!deserialized) return null;
  
  const chain = await getChain();
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

async function getAllocationBallotContent({ ballot } = {}) {
  const deserialized = deserializeBallot(ballot);
  if (!deserialized) return null;

  return deserialized;
}

module.exports = {
  getPayoutBallotContent,
  getAllocationBallotContent,
};
