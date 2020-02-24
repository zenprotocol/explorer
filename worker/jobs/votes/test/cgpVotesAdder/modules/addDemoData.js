'use strict';

const faker = require('faker');
const { Decimal } = require('decimal.js');
const createDemoBlocksFromTo = require('../../../../../../test/lib/createDemoBlocksFromTo');
const blocksDAL = require('../../../../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../../../../server/components/api/transactions/transactionsDAL');
const outputsDAL = require('../../../../../../server/components/api/outputs/outputsDAL');
const contractsDAL = require('../../../../../../server/components/api/contracts/contractsDAL');
const commandsDAL = require('../../../../../../server/components/api/commands/commandsDAL');
const contractId = require('./contractId');
const SnapshotsTaker = require('../../../../snapshots/SnapshotsTaker');

async function addDemoData({
  commands = [],
  lastBlockNumber = 110,
  commandsBlockNumber = 91,
  cgpFundZp = 1000,
  blockchainParser,
}) {
  await createDemoBlocksFromTo(1, lastBlockNumber);

  const contractAddressVote = blockchainParser.getAddressFromContractId(
    contractId.contractIdVoting
  );
  const contractAddressFund = blockchainParser.getAddressFromContractId(contractId.contractIdFund);

  // add a demo contract
  await Promise.all([
    contractsDAL.create({
      id: contractId.contractIdVoting,
      address: contractAddressVote,
      code: '',
      expiryBlock: 1000000,
    }),
    contractsDAL.create({
      id: contractId.contractIdFund,
      address: contractAddressFund,
      code: '',
      expiryBlock: 1000000,
    }),
  ]);

  const block1 = await blocksDAL.findByBlockNumber(1);

  // add ZP to the addresses in the valid message bodies
  const Addresses = [
    '026362f82dee835e645eeeba3b7d235b503537d91233c1c28d257f40d8887cd802',
    '02bf97e00a4fe4f115921ac8b407866c66337281021d6ddf525f845005c582c451',
    '02bc3699a0f36fb2352c41c719b9c944ccf8bc9bfae52206847adfd713a0e26d28',
    '032f64e7f4d053ff2e24d1fc41075605cda80b68decd222ed47374cfce382395cd',
  ].map(pk => blockchainParser.getAddressFromPublicKey(pk));

  for (let i = 0; i < Addresses.length; i++) {
    const address = Addresses[i];
    const amount = 500 * 100000000; // 500 ZP each
    const tx = await transactionsDAL.create({
      index: i,
      version: 0,
      inputCount: 0,
      outputCount: 1,
      hash: faker.random.uuid(),
    });
    await outputsDAL.create({
      TransactionId: tx.id,
      lockType: 'PK',
      address,
      asset: '00',
      amount,
      index: 0,
    });

    await blocksDAL.addTransaction(block1, tx);
  }

  if (cgpFundZp > 0) {
    await addFundBalance({
      asset: '00',
      amount: new Decimal(cgpFundZp).times(100000000).toNumber(),
      blockchainParser,
    });
  }

  await addCommands({ commands, commandsBlockNumber });

  const snapshotsTaker = new SnapshotsTaker({ chain: 'test' });
  await snapshotsTaker.doJob();
}

async function addCommands({ commandsBlockNumber = 91, commands = [] }) {
  if (commands.length) {
    const blockOfCommands = await blocksDAL.findByBlockNumber(commandsBlockNumber);
    // insert a transaction for the commands
    const tx = await transactionsDAL.create({
      BlockId: blockOfCommands.id,
      version: 0,
      index: 0,
      hash: faker.random.uuid(),
      inputCount: 0,
      outputCount: 0,
    });
    // add demo commands
    await commandsDAL.bulkCreate(
      commands.map(command => ({
        command: command.command,
        messageBody: JSON.stringify(command.messageBody),
        ContractId: command.ContractId,
        TransactionId: tx.id,
      }))
    );
  }
}

async function addFundBalance({ blockchainParser, asset, amount }) {
  const contractAddressFund = blockchainParser.getAddressFromContractId(contractId.contractIdFund);
  const block1 = await blocksDAL.findByBlockNumber(1);

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
    address: contractAddressFund,
    asset,
    amount,
    index: 0,
  });
  await blocksDAL.addTransaction(block1, tx);
}

module.exports = { addDemoData, addCommands, addFundBalance };
