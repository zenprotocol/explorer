'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const txsDAL = require('../txs/txsDAL');
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

    const tx = await txsDAL.create({
      blockNumber: 1,
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'PK',
      address: 'tzn111',
      asset: '00',
      amount: '100',
      index: 0,
    });

    const balance = await addressesDAL.snapshotAddressBalancesByBlock({address: 'tzn111', blockNumber: 10});

    t.equal(balance.length, 1, `${given}: should return 1 item`);
    t.equal(balance[0].amount, '100', `${given}: should have the right amount`);
  });

  await wrapTest('Given has 2 assets with positive balance', async given => {
    await createDemoBlocksFromTo(1, 10);

    const tx = await txsDAL.create({
      blockNumber: 1,
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'PK',
      address: 'tzn111',
      asset: '00',
      amount: '100',
      index: 0,
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'PK',
      address: 'tzn111',
      asset: '00000000a515de480812021d184014dc43124254ddc6b994331bc8abe5fbd6c04bc3c130',
      amount: '200',
      index: 0,
    });

    const balance = await addressesDAL.snapshotAddressBalancesByBlock({address: 'tzn111', blockNumber: 10});

    t.equal(balance.length, 2, `${given}: should return 1 item`);
  });

  await wrapTest('Given different lock types', async given => {
    await createDemoBlocksFromTo(1, 10);
    const address= 'ctzn1234';

    const tx = await txsDAL.create({
      blockNumber: 1,
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'Coinbase',
      address,
      asset: '00',
      amount: '1',
      index: 0,
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount: '1',
      index: 1,
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'Contract',
      address,
      asset: '00',
      amount: '1',
      index: 2,
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'ActivationSacrifice',
      address,
      asset: '00',
      amount: '1',
      index: 3,
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'ExtensionSacrifice',
      address,
      asset: '00',
      amount: '1',
      index: 4,
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'Fee',
      address,
      asset: '00',
      amount: '1',
      index: 5,
    });

    const balance = await addressesDAL.snapshotAddressBalancesByBlock({address, blockNumber: 10});

    t.equal(balance.length, 1, `${given}: should return 1 item`);
    t.equal(balance[0].amount, '3', `${given}: should have the amount of only the wanted lock types`);
  });

  await wrapTest('Given has an asset with balance 0', async given => {
    await createDemoBlocksFromTo(1, 10);

    // received
    const tx1 = await txsDAL.create({
      blockNumber: 1,
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    const output1 = await outputsDAL.create({
      blockNumber: 1,
      txId: tx1.id,
      lockType: 'PK',
      address: 'tzn111',
      asset: '00',
      amount: '100',
      index: 0,
    });
    // sent
    const tx2 = await txsDAL.create({
      blockNumber: 2,
      index: 0,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await inputsDAL.create({
      blockNumber: 2,
      index: 0,
      outpointTxHash: tx1.hash,
      outpointIndex: 0,
      isMint: false,
      asset: '00',
      amount: '100',
      txId: tx2.id,
      outputId: output1.id,
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx2.id,
      lockType: 'PK',
      address: 'tzn112',
      asset: '00',
      amount: '100',
      index: 0,
    });

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

