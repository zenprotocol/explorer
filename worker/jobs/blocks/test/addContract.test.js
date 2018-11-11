'use strict';

const test = require('blue-tape');
const truncate = require('../../../lib/truncate');
const contractsDAL = require('../../../../server/components/api/contracts/contractsDAL');
const NetworkHelper = require('../../../lib/NetworkHelper');
const BlocksAdder = require('../BlocksAdder');

test.onFinish(() => {
  contractsDAL.db.sequelize.close();
});

test('BlocksAdder.addContract()', async function(t) {
  await truncate();
  const blocksAdder = new BlocksAdder(new NetworkHelper());
  const demoBlock = require('./data/blockWithContract.json');

  const addedContract = await blocksAdder.addContract({
    nodeBlock: demoBlock,
    transactionHash: '33c1ba62d66a65c3f0bb829eb7b31fb5a6f1ea1b880f96617ca173fc184f02b3',
  });

  t.equals(addedContract, 1, 'Given no contracts in db: Should add a new contract');

  const resultWhenContractInDB = await blocksAdder.addContract({
    nodeBlock: demoBlock,
    transactionHash: '33c1ba62d66a65c3f0bb829eb7b31fb5a6f1ea1b880f96617ca173fc184f02b3',
  });
  t.equals(resultWhenContractInDB, 0, 'Given contract already in db: Should not add a new contract');

  const resultWhenTxHasNoContract = await blocksAdder.addContract({
    nodeBlock: demoBlock,
    transactionHash: '8e411b606462c3b141fbe8728479fe0482c61ed8b8cb1e80822c91dd7daa6ad0',
  });
  t.equals(resultWhenTxHasNoContract, 0, 'Given tx has no contract: Should not add a new contract');
});
