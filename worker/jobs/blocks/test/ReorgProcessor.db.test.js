'use strict';

const test = require('blue-tape');
const truncate = require('../../../../test/lib/truncate');
const blocksDAL = require('../../../../server/components/api/blocks/blocksDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const ReorgProcessor = require('../ReorgProcessor');
const createDemoBlocksFromTo = require('../../../../test/lib/createDemoBlocksFromTo');

test.onFinish(() => {
  blocksDAL.db.sequelize.close();
});

test('ReorgProcessor.doJob() (DB)', async function(t) {
  await wrapTest('Given no reorg', async given => {
    const reorgProcessor = getReorgProcessor();
    // create demo blocks
    await createDemoBlocksFromTo(1, 10);
    const result = await reorgProcessor.doJob();
    t.equal(result.deleted, 0, `${given}: should not delete blocks`);
  });

  await wrapTest('Given a reorg', async given => {
    const reorgProcessor = getReorgProcessor();
    // create demo blocks
    const badHash = 'bad';
    await createDemoBlocksFromTo(1, 6, badHash);
    await createDemoBlocksFromTo(7, 10);
    const result = await reorgProcessor.doJob();
    const allBlocks = await blocksDAL.findAll();
    t.equal(result.deleted, 5, `${given}: should delete blocks`);
    t.equal(allBlocks.length, 5, `${given}: database should have 5 blocks left`);
    const hashes = allBlocks.map(block => block.hash);
    t.assert(!hashes.includes(badHash), `${given}: db should not have the bad hash`);
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

function getReorgProcessor() {
  const networkHelper = new NetworkHelper();
  networkHelper.getBlockFromNode = function(blockNumber) {
    return {
      hash: String(blockNumber),
      header: {
        parent: String(blockNumber - 1),
      },
    };
  };
  return new ReorgProcessor(networkHelper);
}
