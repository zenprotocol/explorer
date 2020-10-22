'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const contractsDAL = require('../../../../server/components/api/contracts/contractsDAL');
const txsDAL = require('../../../../server/components/api/txs/txsDAL');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const BlockchainParser = require('../../../../server/lib/BlockchainParser');
const NetworkHelper = require('../../../lib/NetworkHelper');
const BlocksAdder = require('../BlocksAdder');

test.onFinish(() => {
  contractsDAL.db.sequelize.close();
});

test('BlocksAdder.addContract()', async function (t) {
  const demoBlock = require('./data/blockWithContract.json');

  await wrapTest('Given a transaction with a contract', async (given) => {
    const txHashWithContract = '33c1ba62d66a65c3f0bb829eb7b31fb5a6f1ea1b880f96617ca173fc184f02b3';
    const tx = await addDemoData(txHashWithContract);
    const blocksAdder = new BlocksAdder({
      networkHelper: new NetworkHelper(),
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });
    const addedContract = await blocksAdder.addContract({
      nodeBlock: demoBlock,
      nodeTx: demoBlock.transactions[txHashWithContract],
      tx,
    });

    t.equals(addedContract, 1, `${given}: when contract is missing should add the new contract`);

    const resultWhenContractInDB = await blocksAdder.addContract({
      nodeBlock: demoBlock,
      nodeTx: demoBlock.transactions[txHashWithContract],
      tx,
    });
    t.equals(
      resultWhenContractInDB,
      0,
      `${given}: when contract is already there should not add the contract`
    );
  });

  await wrapTest('Given a transaction with no contract', async (given) => {
    const txHashWithoutContract =
      '8e411b606462c3b141fbe8728479fe0482c61ed8b8cb1e80822c91dd7daa6ad0';
    const tx = await addDemoData(txHashWithoutContract);
    const blocksAdder = new BlocksAdder({
      networkHelper: new NetworkHelper(),
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });
    const resultWhenTxHasNoContract = await blocksAdder.addContract({
      nodeBlock: demoBlock,
      nodeTx: demoBlock.transactions[txHashWithoutContract],
      tx,
    });
    t.equals(resultWhenTxHasNoContract, 0, `${given}: Should not add a new contract`);
  });

  await wrapTest('Given a transaction with a contract (association)', async (given) => {
    const txHashWithContract = '33c1ba62d66a65c3f0bb829eb7b31fb5a6f1ea1b880f96617ca173fc184f02b3';
    const tx = await addDemoData(txHashWithContract);
    const blocksAdder = new BlocksAdder({
      networkHelper: new NetworkHelper(),
      blockchainParser: new BlockchainParser(),
      genesisTotalZp: '20000000',
      chain: 'main',
      cgpFundContractId: '00000000cdaa2a511cd2e1d07555b00314d1be40a649d3b6f419eb1e4e7a8e63240a36d1',
    });
    await blocksAdder.addContract({
      nodeBlock: demoBlock,
      nodeTx: demoBlock.transactions[txHashWithContract],
      tx,
    });
    const contract = await contractsDAL.findById(
      '00000000cfcfe6bba6775dd01b3b11f0d2b03b134ed678b75468d221866bf030f679118a'
    );
    const transactions = await contractsDAL.getActivationTxs(contract);

    t.equals(transactions.length, 1, `${given}: should associate the relevant transaction`);
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

async function addDemoData(txHash) {
  const block = await blocksDAL.create({
    blockNumber: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return txsDAL.create({
    hash: txHash,
    index: 0,
    version: 0,
    inputCount: 0,
    outputCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    blockNumber: block.blockNumber,
  });
}
