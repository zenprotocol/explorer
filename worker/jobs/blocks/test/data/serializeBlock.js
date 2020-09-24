'use strict';

const BigInteger = require('bigi');
const {
  Block,
  Transaction,
  Header,
  Output,
  Input,
  Spend,
  Asset,
  Hash,
  ContractId,
  Nonce,
  PK,
  Coinbase,
  Fee,
  ActivationSacrifice,
  Contract,
  ExtensionSacrifice,
  Destroy,
} = require('@zen/zenjs');

function bigi(number) {
  return new BigInteger(number.toString(10), 10);
}

function parseLock(key) {
  switch (Object.keys(key)[0]) {
    case 'PK':
      return new PK(Hash.fromBytes(key.PK.hash));
    case 'Coinbase':
      return new Coinbase(key.Coinbase.blockNumber, Hash.fromBytes(key.Coinbase.pkHash));
    case 'ActivationSacrifice':
      return new ActivationSacrifice();
    case 'Contract':
      return new Contract(ContractId.fromString(key.Contract.id));
    case 'ExtensionSacrifice':
      return new ExtensionSacrifice(ContractId.fromString(key.ExtensionSacrifice.id));
    case 'Destroy':
      return new Destroy();
    case 'Fee':
      return new Fee();
    default:
      throw 'Not Supposed to be here';
  }
}

function parseOutput(output) {
  return new Output(
    parseLock(output.lock),
    new Spend(new Asset(output.spend.asset), output.spend.amount)
  );
}

function parseInput(key) {
  switch (Object.keys(key)[0]) {
    case 'mint':
      return { kind: 'mint', spend: new Spend(new Asset(key.mint.asset), key.mint.amount) };
    case 'outpoint':
      return { kind: 'outpoint', txHash: key.outpoint.txHash, index: key.outpoint.index };
    case 'pointedOutput':
      //return {kind: 'pointedOutput', outpoint:{kind: 'outpoint', txHash: key.outpoint.txHash, index: key.outpoint.index},output: new Output(parseLock(key.pointedOutput.lock), new Spend(new Asset(key.pointedOutput.spend.asset), key.pointedOutput.spend.amount))}
      throw 'you should not have it in blockchain/block';
  }
}

function parseInputs(input) {
  return new Input(parseInput(input));
}

function parseTx(tx) {
  let outputs = tx.outputs.map(parseOutput);
  let inputs = tx.inputs.map(parseInputs);
  const version = tx.version;
  return new Transaction(version, inputs, outputs);
}

module.exports = function (blockJson) {
  const header = {
    version: blockJson.header.version,
    parent: Hash.fromBytes(blockJson.header.parent),
    blockNumber: blockJson.header.blockNumber,
    commitments: Hash.fromBytes(blockJson.header.commitments),
    timestamp: bigi(blockJson.header.commitments),
    difficulty: blockJson.header.difficulty,
    nonce: new Nonce([bigi(blockJson.header.nonce[0]), bigi(blockJson.header.nonce[1])]),
  };
  
  let transactions = Object.keys(blockJson.transactions).map((key) =>
  parseTx(blockJson.transactions[key])
  );

  return new Block({
    header: new Header(header),
    txMerkleRoot: Hash.zero(),
    witnessMerkleRoot: Hash.zero(),
    activeContractSetMerkleRoot: Hash.zero(),
    commitments: [Hash.zero()],
    transactions,
  }).toHex();
};
