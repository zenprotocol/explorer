'use strict';

const { Address, Payout, Ballot, Spend, Asset, ContractId } = require('@zen/zenjs');

module.exports = function ({ address, spends } = {}) {
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
  return spends.map((spend) => {
    const { asset, amount } = spend;
    return new Spend(new Asset(asset), amount);
  });
}
