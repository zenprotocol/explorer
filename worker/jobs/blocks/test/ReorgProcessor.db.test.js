'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const txsDAL = require('../../../../server/components/api/txs/txsDAL');
const outputsDAL = require('../../../../server/components/api/outputs/outputsDAL');
const inputsDAL = require('../../../../server/components/api/inputs/inputsDAL');
const addressesDAL = require('../../../../server/components/api/addresses/addressesDAL');
const assetsDAL = require('../../../../server/components/api/assets/assetsDAL');
const addressTxsDAL = require('../../../../server/components/api/address-txs/addressTxsDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const ReorgProcessor = require('../ReorgProcessor');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('ReorgProcessor.doJob() (DB)', async function (t) {
  await wrapTest('Given no reorg', async (given) => {
    const reorgProcessor = getReorgProcessor();
    // create demo blocks
    await createDemoBlocksFromTo(1, 10);
    const result = await reorgProcessor.doJob();
    t.equal(result.deleted, 0, `${given}: should not delete blocks`);
  });

  await wrapTest('Given a reorg', async (given) => {
    const reorgProcessor = getReorgProcessor();
    // create demo blocks
    const badHash = 'bad';
    await createDemoBlocksFromTo(1, 6, badHash);
    await createDemoBlocksFromTo(7, 10);
    const result = await reorgProcessor.doJob();
    const allBlocks = await blocksDAL.findAll();
    t.equal(result.deleted, 5, `${given}: should delete blocks`);
    t.equal(allBlocks.length, 5, `${given}: database should have 5 blocks left`);
    const hashes = allBlocks.map((block) => block.hash);
    t.assert(!hashes.includes(badHash), `${given}: db should not have the bad hash`);
  });
  await wrapTest('Given a reorg and address balances', async (given) => {
    const address = 'zen1qmwpd6utdzqq4lg52c70f6ae5lpmvcqtm0gvaxqlrvxt79wquf38s9mrydf';
    const reorgProcessor = getReorgProcessor();
    // create demo blocks
    const badHash = 'bad';
    await createDemoBlocksFromTo(1, 6, badHash);
    await createDemoBlocksFromTo(7, 10);
    // add demo txs
    let txBlock6;
    let outputBlock1;
    for (let i = 1; i <= 10; i++) {

      const tx = await txsDAL.create({
        blockNumber: i,
        index: 0,
        hash: 'aaa' + i,
      });
      const output = await outputsDAL.create({
        blockNumber: i,
        txId: tx.id,
        index: 0,
        lockType: 'Coinbase',
        address,
        asset: '00',
        amount: 1,
      });
      await addressTxsDAL.create({
        blockNumber: i,
        txId: tx.id,
        address,
      });
      if (i === 1) {
        outputBlock1 = output;
      }
      if(i === 6) {
        txBlock6 = tx;
      }
    }

    // add addresses data in block 6
    await inputsDAL.create({
      blockNumber: 6,
      txId: txBlock6.id,
      outputId: outputBlock1.id,
      index: 0,
      isMint: false,
      lockType: 'Coinbase',
      address,
      asset: '00',
      amount: 1,
    });

    await addressesDAL.create({
      address,
      asset: '00',
      inputSum: '1',
      outputSum: '10',
      balance: '9',
      txsCount: '2',
    });
    await assetsDAL.create({
      asset: '00',
      issued: '2000045000000000',
      destroyed: '0',
      outstanding: '2000045000000000',
      keyholders: '1',
      txsCount: '10',
    });

    await reorgProcessor.doJob();
    const addressDb = await addressesDAL.findOne({ where: { address, asset: '00' } });
    const assetDb = await assetsDAL.findOne({ where: { asset: '00' } });
    const addressTxsDb = await addressTxsDAL.findAll({ where: { address } });
    t.equal(
      addressDb.balance,
      '5',
      `${given}: should revert the balance to the state before the reorg`
    );
    t.equal(addressTxsDb.length, 5, `${given}: should delete all AddressTxs from the fork`);
    t.assert(addressTxsDb.every(a => a.blockNumber < 6), `${given}: should leave AddressTxs before the fork`);
    t.equal(
      assetDb.issued,
      '2000020000000000',
      `${given}: should revert asset.issued to the state before the reorg`
    );
    t.equal(
      assetDb.outstanding,
      '2000020000000000',
      `${given}: should revert asset.outstanding to the state before the reorg`
    );
    t.equal(
      assetDb.txsCount,
      '5',
      `${given}: should revert asset.txsCount to the state before the reorg`
    );
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

function getReorgProcessor() {
  const networkHelper = new NetworkHelper();
  networkHelper.getBlockFromNode = function (blockNumber) {
    return Promise.resolve({
      hash: String(blockNumber),
      header: {
        parent: String(blockNumber - 1),
      },
    });
  };
  return new ReorgProcessor(networkHelper, '20000000');
}
