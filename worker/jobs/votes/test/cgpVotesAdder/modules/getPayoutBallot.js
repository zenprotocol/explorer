'use strict';

const { Payout } = require('@zen/zenjs/build/src/Consensus/Types/Payout');
const { Ballot } = require('@zen/zenjs/build/src/Consensus/Types/Ballot');
const { Spend } = require('@zen/zenjs/build/src/Consensus/Types/Spend');
const { Asset } = require('@zen/zenjs/build/src/Consensus/Types/Asset');
const { ContractId } = require('@zen/zenjs/build//src/Consensus/Types/ContractId');
const { Address } = require('@zen/zenjs');

module.exports = function({ address, spends } = {}) {
  const payout = toPayout('testnet', address, spends);
  return new Ballot(payout).toHex();
};

function toPayout(chain, recipient, spends) {
  const spendArr = toSpend(spends);
  const address = Address.decode(chain, recipient);
  if (address instanceof ContractId) {
    return new Payout(
      {
        kind: 'ContractRecipient',
        contractId: address,
      },
      spendArr
    );
  }
  return new Payout(
    {
      kind: 'PKRecipient',
      hash: address,
    },
    spendArr
  );
}

function toSpend(spends) {
  return spends.map(spend => {
    const { asset, amount } = spend;
    return new Spend(new Asset(asset), amount);
  });
}
