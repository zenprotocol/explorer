'use strict';

const test = require('blue-tape');
const faker = require('faker');
const truncate = require('../../../../../worker/lib/truncate');
const transactionsDAL = require('../transactionsDAL');
const blocksDAL = require('../../blocks/blocksDAL');
const inputsDAL = require('../../inputs/inputsDAL');
const outputsDAL = require('../../outputs/outputsDAL');

const CURRENT_BLOCK_NUMBER = 1000;

test.onFinish(() => {
  transactionsDAL.db.sequelize.close();
});

test('TransactionsDAL.findAllAssetsByBlock()', async function(t) {
  await wrapTest('Given Address A sends 50 to Address B', async given => {
    await insertDemoDbTxData({
      from: [
        {
          address: 'A',
          amount: 50,
        },
      ],
      to: [
        {
          address: 'B',
          amount: 50,
        },
      ],
    });
    const result = await transactionsDAL.findAllAssetsByBlock(CURRENT_BLOCK_NUMBER);
    t.equal(result.length, 1, `${given}: should get one db row`);
    t.equal(Number(result[0].totalMoved), 50, `${given}: totalMoved should be 50`);
  });

  await wrapTest('Given Address A sends 50 to Address B with change back', async given => {
    await insertDemoDbTxData({
      from: [
        {
          address: 'A',
          amount: 51,
        },
      ],
      to: [
        {
          address: 'B',
          amount: 50,
        },
        {
          address: 'A',
          amount: 1,
        },
      ],
    });
    const result = await transactionsDAL.findAllAssetsByBlock(CURRENT_BLOCK_NUMBER);
    t.equal(Number(result[0].totalMoved), 50, `${given}: totalMoved should be 50`);
  });

  await wrapTest('Given Address A sends 50 to Address B with change > 50', async given => {
    await insertDemoDbTxData({
      from: [
        {
          address: 'A',
          amount: 200,
        },
      ],
      to: [
        {
          address: 'B',
          amount: 50,
        },
        {
          address: 'A',
          amount: 150,
        },
      ],
    });
    const result = await transactionsDAL.findAllAssetsByBlock(CURRENT_BLOCK_NUMBER);
    t.equal(Number(result[0].totalMoved), 50, `${given}: totalMoved should be 50`);
  });

  await wrapTest('Given A 50-> B, B 50-> C', async given => {
    await insertDemoDbTxData({
      from: [
        {
          address: 'A',
          amount: 50,
        },
        {
          address: 'B',
          amount: 50,
        },
      ],
      to: [
        {
          address: 'B',
          amount: 50,
        },
        {
          address: 'C',
          amount: 50,
        },
      ],
    });
    const result = await transactionsDAL.findAllAssetsByBlock(CURRENT_BLOCK_NUMBER);
    t.equal(Number(result[0].totalMoved), 50, `${given}: totalMoved should be 50`);
  });

  await wrapTest('Given A 50-> B 1-> A, B 50-> C', async given => {
    await insertDemoDbTxData({
      from: [
        {
          address: 'A',
          amount: 51,
        },
        {
          address: 'B',
          amount: 50,
        },
      ],
      to: [
        {
          address: 'B',
          amount: 50,
        },
        {
          address: 'C',
          amount: 50,
        },
        {
          address: 'A',
          amount: 1,
        },
      ],
    });
    const result = await transactionsDAL.findAllAssetsByBlock(CURRENT_BLOCK_NUMBER);
    t.equal(Number(result[0].totalMoved), 50, `${given}: totalMoved should be 50`);
  });

  await wrapTest('Given A 50-> B, C 50-> D', async given => {
    await insertDemoDbTxData({
      from: [
        {
          address: 'A',
          amount: 50,
        },
        {
          address: 'C',
          amount: 50,
        },
      ],
      to: [
        {
          address: 'B',
          amount: 50,
        },
        {
          address: 'D',
          amount: 50,
        },
      ],
    });
    const result = await transactionsDAL.findAllAssetsByBlock(CURRENT_BLOCK_NUMBER);
    t.equal(Number(result[0].totalMoved), 100, `${given}: totalMoved should be 100`);
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

/**
 * Inserts demo data into the database, describing one tx in which ZP was moved
 *
 * @param {*} [{from = [], to = []}={}] from and to are arrays containing object which describe the transaction
 * each element should have this form: { address: 'A', amount: 123 }
 */
async function insertDemoDbTxData({ from = [], to = [] } = {}) {
  const currentBlock = await blocksDAL.create({
    version: 0,
    hash: faker.random.uuid(),
    blockNumber: CURRENT_BLOCK_NUMBER,
    timestamp: Date.now(),
  });
  const prevBlock = await blocksDAL.create({
    version: 0,
    hash: faker.random.uuid(),
    blockNumber: CURRENT_BLOCK_NUMBER - 1,
    timestamp: Date.now(),
  });
  const currentTx = await transactionsDAL.create({
    version: 0,
    hash: faker.random.uuid(),
    index: 0, // not relevant
    inputCount: 1, // not relevant
    outputCount: 1, // not relevant
    BlockId: currentBlock.id,
  });

  // for each 'from' address, create a transaction with an output
  // then create an input that points to this output
  for (let i = 0; i < from.length; i++) {
    const element = from[i];
    const tx = await transactionsDAL.create({
      version: 0,
      hash: faker.random.uuid(),
      index: 0, // not relevant
      inputCount: 1, // not relevant
      outputCount: 1, // not relevant
      BlockId: prevBlock.id,
    });
    const output = await outputsDAL.create({
      lockType: 'PK',
      address: element.address,
      asset: '00',
      amount: element.amount,
      index: 0,
      TransactionId: tx.id,
    });
    // the input for the current tx
    await inputsDAL.create({
      index: 0,
      isMint: false,
      OutputId: output.id,
      TransactionId: currentTx.id,
    });
  }

  // for each 'to' address, create an output
  for (let i = 0; i < to.length; i++) {
    const element = to[i];
    await outputsDAL.create({
      lockType: 'PK',
      address: element.address,
      asset: '00',
      amount: element.amount,
      index: i,
      TransactionId: currentTx.id,
    });
  }
}
