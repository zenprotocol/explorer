'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const truncate = require('../../../test/lib/truncate');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const commandsDAL = require('../../../server/components/api/commands/commandsDAL');
const BlockchainParser = require('../../../server/lib/BlockchainParser');
const VotesAdder = require('./VotesAdder');
const commandsData = require('./test/data/commands.json');

const CONTRACT_ID = 'test-contract-id';

test.onFinish(() => {
  commandsDAL.db.sequelize.close();
});

test('VotesAdder.doJob() (DB)', async function(t) {
  await wrapTest('Given no commands', async given => {
    const votesAdder = new VotesAdder({blockchainParser: new BlockchainParser(), contractId: CONTRACT_ID});
    before(votesAdder);
    const result = await votesAdder.doJob();
    t.equal(result, 0, `${given}: should not add any votes`);
    after();
  });

  await wrapTest('Given commands', async given => {
    const votesAdder = new VotesAdder({blockchainParser: new BlockchainParser(), contractId: CONTRACT_ID});
    before(votesAdder);

    // add a demo contract
    await contractsDAL.create({
      id: CONTRACT_ID,
      address: 'whatever',
      code: '',
      expiryBlock: 1000000,
    });
    // add demo commands
    await commandsDAL.bulkCreate(commandsData.map(command => ({
      command: command.command,
      messageBody: JSON.stringify(command.messageBody),
      ContractId: command.ContractId,
    })));
    const result = await votesAdder.doJob();
    t.equal(result, 14, `${given}: should add all votes`);
    after();
  });
});

async function wrapTest(given, test) {
  await truncate();
  await test(given);
}

function before(votesAdder) {
  td.replace(votesAdder, 'verify');
  td.when(votesAdder.verify(td.matchers.anything())).thenReturn(true);
}
function after() {
  td.reset();
}