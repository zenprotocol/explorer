'use strict';

const faker = require('faker');
const createDemoBlocksFromTo = require('../../../../../../test/lib/createDemoBlocksFromTo');
const blocksDAL = require('../../../../../../server/components/api/blocks/blocksDAL');
const transactionsDAL = require('../../../../../../server/components/api/transactions/transactionsDAL');
const contractsDAL = require('../../../../../../server/components/api/contracts/contractsDAL');
const commandsDAL = require('../../../../../../server/components/api/commands/commandsDAL');
const CONTRACT_ID = require('./contractId');

async function addDemoData({ commands = [], commandsBlockNumber = 91 }) {
  await createDemoBlocksFromTo(1, 100);

  // add a demo contract
  await contractsDAL.create({
    id: CONTRACT_ID,
    address: 'whatever',
    code: '',
    expiryBlock: 1000000,
  });
  await addCommands({ commands, commandsBlockNumber });
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

module.exports = { addDemoData, addCommands };
