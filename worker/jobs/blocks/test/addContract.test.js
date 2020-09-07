'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const contractsDAL = require('../../../../server/components/api/contracts/contractsDAL');
const transactionsDAL = require('../../../../server/components/api/txs/txsDAL');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const BlocksAdder = require('../BlocksAdder');

test.onFinish(() => {
  contractsDAL.db.sequelize.close();
});

test('BlocksAdder.addContract()', async function(t) {
  const demoBlock = require('./data/blockWithContract.json');

  await wrapTest('Given a transaction with a contract', async given => {
    const blocksAdder = new BlocksAdder(new NetworkHelper());
    const addedContract = await blocksAdder.addContract({
      nodeBlock: demoBlock,
      txHash: '33c1ba62d66a65c3f0bb829eb7b31fb5a6f1ea1b880f96617ca173fc184f02b3',
    });

    t.equals(addedContract, 1, `${given}: when contract is missing should add the new contract`);

    const resultWhenContractInDB = await blocksAdder.addContract({
      nodeBlock: demoBlock,
      txHash: '33c1ba62d66a65c3f0bb829eb7b31fb5a6f1ea1b880f96617ca173fc184f02b3',
    });
    t.equals(
      resultWhenContractInDB,
      0,
      `${given}: when contract is already there should not add the contract`
    );
  });

  await wrapTest('Given a transaction with no contract', async given => {
    const blocksAdder = new BlocksAdder(new NetworkHelper());
    const resultWhenTxHasNoContract = await blocksAdder.addContract({
      nodeBlock: demoBlock,
      txHash: '8e411b606462c3b141fbe8728479fe0482c61ed8b8cb1e80822c91dd7daa6ad0',
    });
    t.equals(resultWhenTxHasNoContract, 0, `${given}: Should not add a new contract`);
  });

  await wrapTest('Given a transaction with a contract (association)', async given => {
    const blocksAdder = new BlocksAdder(new NetworkHelper());
    // add a demo transaction and block with the hash of the contract tx
    const block = await blocksDAL.create({
      blockNumber: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await transactionsDAL.create({
      hash: '33c1ba62d66a65c3f0bb829eb7b31fb5a6f1ea1b880f96617ca173fc184f02b3',
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      blockNumber: block.blockNumber,
    });
    await blocksAdder.addContract({
      nodeBlock: demoBlock,
      txHash: '33c1ba62d66a65c3f0bb829eb7b31fb5a6f1ea1b880f96617ca173fc184f02b3',
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
