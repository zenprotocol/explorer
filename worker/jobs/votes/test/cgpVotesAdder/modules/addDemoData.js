'use strict';

const faker = require('faker');
const { Decimal } = require('decimal.js');
const createDemoBlocksFromTo = require('../../../../../../test/lib/createDemoBlocksFromTo');
const txsDAL = require('../../../../../../server/components/api/txs/txsDAL');
const outputsDAL = require('../../../../../../server/components/api/outputs/outputsDAL');
const contractsDAL = require('../../../../../../server/components/api/contracts/contractsDAL');
const executionsDAL = require('../../../../../../server/components/api/executions/executionsDAL');
const cgpAdderParams = require('./cgpAdderParams');
const SnapshotsTaker = require('../../../../snapshots/SnapshotsTaker');

async function addDemoData({
  executions = [],
  lastBlockNumber = 110,
  executionsBlockNumber = 91,
  cgpFundZp = 1000,
  blockchainParser,
  takeSnapshot = true,
}) {
  await createDemoBlocksFromTo(1, lastBlockNumber);

  const contractAddressVote = blockchainParser.getAddressFromContractId(
    cgpAdderParams.contractIdVoting
  );
  const contractAddressFund = blockchainParser.getAddressFromContractId(
    cgpAdderParams.contractIdFund
  );

  // add a demo contract
  await Promise.all([
    contractsDAL.create({
      id: cgpAdderParams.contractIdVoting,
      address: contractAddressVote,
      code: '',
      expiryBlock: 1000000,
    }),
    contractsDAL.create({
      id: cgpAdderParams.contractIdFund,
      address: contractAddressFund,
      code: '',
      expiryBlock: 1000000,
    }),
  ]);

  // add ZP to the addresses in the valid message bodies
  const Addresses = [
    '026362f82dee835e645eeeba3b7d235b503537d91233c1c28d257f40d8887cd802',
    '02bf97e00a4fe4f115921ac8b407866c66337281021d6ddf525f845005c582c451',
    '02bc3699a0f36fb2352c41c719b9c944ccf8bc9bfae52206847adfd713a0e26d28',
    '032f64e7f4d053ff2e24d1fc41075605cda80b68decd222ed47374cfce382395cd',
    '02a8ea49e091ebdab34694d79851edd1ae0042f02f45e8addeedd636eb1bc7f94c', // extra address to use
    '038a20015c9309fb623ee2c9fee2cfb22d6a0fc89e437a8926733b15efd13b1556', // extra address to use
  ].map((pk) => blockchainParser.getAddressFromPublicKey(pk));

  for (let i = 0; i < Addresses.length; i++) {
    const address = Addresses[i];
    const amount = 500 * 100000000; // 500 ZP each
    const tx = await txsDAL.create({
      blockNumber: 1,
      index: i,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      blockNumber: 1,
      txId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount,
      index: 0,
    });
  }

  if (cgpFundZp > 0) {
    await addFundBalance({
      asset: '00',
      amount: new Decimal(cgpFundZp).times(100000000).toNumber(),
      blockchainParser,
    });
  }

  await addExecutions({ executions, executionsBlockNumber });
  if(takeSnapshot) {
    const snapshotsTaker = new SnapshotsTaker({ chain: 'test' });
    await snapshotsTaker.doJob();
  }
}

async function addExecutions({ executionsBlockNumber = 91, executions = [] }) {
  if (executions.length) {
    // insert a transaction for the executions
    const tx = await txsDAL.create({
      blockNumber: executionsBlockNumber,
      version: 0,
      index: 0,
      hash: faker.random.uuid(),
      inputCount: 0,
      outputCount: 0,
    });
    // add demo executions
    await executionsDAL.bulkCreate(
      executions.map((execution) => ({
        contractId: execution.contractId,
        blockNumber: executionsBlockNumber,
        txId: tx.id,
        command: execution.command,
        messageBody: JSON.stringify(execution.messageBody),
      }))
    );
  }
}

/**
 * Adds one execution, returns [tx, execution]
 */
async function addExecution({ blockNumber = 91, txIndex = 0, execution } = {}) {
  const tx = await txsDAL.create({
    blockNumber: blockNumber,
    version: 0,
    index: txIndex,
    hash: faker.random.uuid(),
    inputCount: 0,
    outputCount: 0,
  });
  // add demo executions
  const e = await executionsDAL.create({
    contractId: execution.contractId,
    blockNumber: blockNumber,
    txId: tx.id,
    command: execution.command,
    messageBody: JSON.stringify(execution.messageBody),
  });

  return [tx, e];
}

async function addFundBalance({ blockchainParser, asset, amount }) {
  const contractAddressFund = blockchainParser.getAddressFromContractId(
    cgpAdderParams.contractIdFund
  );

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
    address: contractAddressFund,
    asset,
    amount,
    index: 0,
  });
}

module.exports = { addDemoData, addExecutions, addExecution, addFundBalance };
