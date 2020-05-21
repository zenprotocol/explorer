'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const transactionsDAL = require('../transactions/transactionsDAL');
const blocksDAL = require('../blocks/blocksDAL');
const outputsDAL = require('../outputs/outputsDAL');
const inputsDAL = require('../inputs/inputsDAL');
const addressesDAL = require('../addresses/addressesDAL');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');
const faker = require('faker');

test('addressesDAL.snapshotAddressBalancesByBlock() (DB)', async function(t) {
  await wrapTest('Given no transactions', async given => {
    await createDemoBlocksFromTo(1, 10);

    const balance = await addressesDAL.snapshotAddressBalancesByBlock({address: 'tzn111', blockNumber: 10});

    t.equal(balance.length, 0, `${given}: should return an empty array`);
  });

  await wrapTest('Given has an asset with positive balance', async given => {
    await createDemoBlocksFromTo(1, 10);

    const block = await blocksDAL.findByBlockNumber(1);
    const tx = await transactionsDAL.create({
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'PK',
      address: 'tzn111',
      asset: '00',
      amount: '100',
      index: 0,
    });
    await blocksDAL.addTransaction(block, tx);

    const balance = await addressesDAL.snapshotAddressBalancesByBlock({address: 'tzn111', blockNumber: 10});

    t.equal(balance.length, 1, `${given}: should return 1 item`);
    t.equal(balance[0].amount, '100', `${given}: should have the right amount`);
  });

  await wrapTest('Given has 2 assets with positive balance', async given => {
    await createDemoBlocksFromTo(1, 10);

    const block = await blocksDAL.findByBlockNumber(1);
    const tx = await transactionsDAL.create({
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'PK',
      address: 'tzn111',
      asset: '00',
      amount: '100',
      index: 0,
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'PK',
      address: 'tzn111',
      asset: '00000000a515de480812021d184014dc43124254ddc6b994331bc8abe5fbd6c04bc3c130',
      amount: '200',
      index: 0,
    });
    await blocksDAL.addTransaction(block, tx);

    const balance = await addressesDAL.snapshotAddressBalancesByBlock({address: 'tzn111', blockNumber: 10});

    t.equal(balance.length, 2, `${given}: should return 1 item`);
  });

  await wrapTest('Given different lock types', async given => {
    await createDemoBlocksFromTo(1, 10);
    const address= 'ctzn1234';

    const block = await blocksDAL.findByBlockNumber(1);
    const tx = await transactionsDAL.create({
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'Coinbase',
      address,
      asset: '00',
      amount: '1',
      index: 0,
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount: '1',
      index: 1,
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'Contract',
      address,
      asset: '00',
      amount: '1',
      index: 2,
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'ActivationSacrifice',
      address,
      asset: '00',
      amount: '1',
      index: 3,
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'ExtensionSacrifice',
      address,
      asset: '00',
      amount: '1',
      index: 4,
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'Fee',
      address,
      asset: '00',
      amount: '1',
      index: 5,
    });
    await blocksDAL.addTransaction(block, tx);

    const balance = await addressesDAL.snapshotAddressBalancesByBlock({address, blockNumber: 10});

    t.equal(balance.length, 1, `${given}: should return 1 item`);
    t.equal(balance[0].amount, '3', `${given}: should have the amount of only the wanted lock types`);
  });

  await wrapTest('Given has an asset with balance 0', async given => {
    await createDemoBlocksFromTo(1, 10);

    const block1 = await blocksDAL.findByBlockNumber(1);
    const block2 = await blocksDAL.findByBlockNumber(2);
    // received
    const tx1 = await transactionsDAL.create({
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    const output1 = await outputsDAL.create({
      TransactionId: tx1.id,
      lockType: 'PK',
      address: 'tzn111',
      asset: '00',
      amount: '100',
      index: 0,
    });
    // sent
    const tx2 = await transactionsDAL.create({
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await inputsDAL.create({
      index: 0,
      outpointTXHash: tx1.hash,
      outpointIndex: 0,
      isMint: false,
      asset: '00',
      amount: '100',
      TransactionId: tx2.id,
      OutputId: output1.id,
    });
    await outputsDAL.create({
      TransactionId: tx2.id,
      lockType: 'PK',
      address: 'tzn112',
      asset: '00',
      amount: '100',
      index: 0,
    });
    await blocksDAL.addTransaction(block1, tx1);
    await blocksDAL.addTransaction(block2, tx2);

    const balance = await addressesDAL.snapshotAddressBalancesByBlock({address: 'tzn111', blockNumber: 10});

    t.equal(balance.length, 0, `${given}: should return no items`);
  });

});


test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

