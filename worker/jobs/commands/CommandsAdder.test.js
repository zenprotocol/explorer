'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const NetworkHelper = require('../../lib/NetworkHelper');
const commandsData = require('./test/data/commands.json');

const CONTRACT_ID_1 = '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b63';
const CONTRACT_ID_2 = '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b64';
const CUSTOM_TAKE = 10;
const LATEST_BLOCK_NUMBER = 40000; // check if the db is synced

let commandsAdder;
let blocksDAL;
let contractsDAL;
let transactionsDAL;
let commandsDAL;

function before() {
  blocksDAL = td.replace('../../../server/components/api/blocks/blocksDAL', {
    findLatest: td.func('findLatest'),
  });
  contractsDAL = td.replace('../../../server/components/api/contracts/contractsDAL', {
    findAllActive: td.func('findAllActive'),
    countCommands: td.func('countCommands'),
    getLastCommandOfTx: td.func('getLastCommandOfTx'),
    deleteCommands: td.func('delete'),
  });
  transactionsDAL = td.replace('../../../server/components/api/transactions/transactionsDAL', {
    findOne: td.func('findOne'),
  });
  commandsDAL = td.replace('../../../server/components/api/commands/commandsDAL', {
    bulkCreate: td.func('bulkCreate'),
  });
  const FakeNetworkHelper = td.constructor(NetworkHelper);
  // return the same commands for all contracts
  const dataToReturn = JSON.parse(JSON.stringify(commandsData));
  [CONTRACT_ID_1, CONTRACT_ID_2].forEach(contractId => {
    td.when(
      FakeNetworkHelper.prototype.getContractCommandsFromNode({
        contractId,
        skip: 0,
        take: dataToReturn.length,
      })
    ).thenResolve(dataToReturn);
    td.when(
      FakeNetworkHelper.prototype.getContractCommandsFromNode({
        contractId,
        skip: dataToReturn.length,
        take: dataToReturn.length,
      })
    ).thenResolve([]);

    for (let skip = 0; skip < dataToReturn.length; skip += CUSTOM_TAKE) {
      td.when(
        FakeNetworkHelper.prototype.getContractCommandsFromNode({
          contractId,
          skip: skip,
          take: CUSTOM_TAKE,
        })
      ).thenResolve(dataToReturn.slice(skip, skip + CUSTOM_TAKE));
    }
  });
  td.when(FakeNetworkHelper.prototype.getLatestBlockNumberFromNode()).thenResolve(LATEST_BLOCK_NUMBER);

  const CommandsAdder = require('./CommandsAdder');
  commandsAdder = new CommandsAdder(new FakeNetworkHelper());
}
function after() {
  td.reset();
}

test('CommandsAdder.doJob()', async function(t) {
  function stub({
    activeContracts = [],
    commandsCount = 0,
    transactionId = 1,
    latestBlockNumber = LATEST_BLOCK_NUMBER,
  } = {}) {
    td.when(contractsDAL.findAllActive()).thenResolve(activeContracts);
    td.when(contractsDAL.countCommands(td.matchers.isA(String))).thenResolve(commandsCount);
    td.when(contractsDAL.deleteCommands(td.matchers.isA(String))).thenResolve(commandsCount);
    td.when(transactionsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: transactionId });
    td.when(blocksDAL.findLatest()).thenResolve([{blockNumber: latestBlockNumber}]);
  }
  await (async function doJob_shouldReturnANumber() {
    before();
    stub();
    const result = await commandsAdder.doJob({});
    t.assert(typeof result === 'number', 'doJob() should return a number');
    after();
  })();

  await (async function doJob_shouldCallBulkCreate() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }] });
    await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    try {
      td.verify(commandsDAL.bulkCreate(td.matchers.isA(Array)));
      t.pass('Should call commandsDAL.bulkCreate');
    } catch (error) {
      console.log(error);
      t.fail('Should call commandsDAL.bulkCreate');
    }
    after();
  })();

  await (async function doJob_dbNotSynced() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], latestBlockNumber: LATEST_BLOCK_NUMBER - 1 });
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(
      result,
      0,
      'Given a not synced db: should not insert anything'
    );
    after();
  })();

  await (async function doJob_oneContract_nothingInDb() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }] });
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(
      result,
      commandsData.length,
      'Given a synced db, no commands data and 1 contract: should insert all commandsData'
    );
    after();
  })();

  await (async function doJob_severalContracts_nothingInDb() {
    before();
    stub({
      activeContracts: [{ id: CONTRACT_ID_1 }, { id: CONTRACT_ID_2 }],
    });
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(
      result,
      commandsData.length * 2,
      'Given no data in db and 2 contracts: should insert all commandsData twice'
    );
    after();
  })();

  await (async function doJob_oneContract_lessInDb() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], commandsCount: commandsData.length - 1 });
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(result, commandsData.length, 'Given less data in db: should insert all commandsData');
    after();
  })();

  await (async function doJob_oneContract_moreInDb() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], commandsCount: commandsData.length + 1 });
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(result, commandsData.length, 'Given more data in db: should insert all commandsData');
    after();
  })();

  await (async function doJob_oneContract_someInDb() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], commandsCount: commandsData.length });
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(result, 0, 'Given same data in db: should not insert anything');
    after();
  })();
});

test('CommandsAdder.getCommandsToInsert()', async function(t) {
  function stub({
    contract = CONTRACT_ID_1,
    transactionId = 1,
    commandsCount = 0,
    command = null,
    txHashParam = td.matchers.isA(String),
  } = {}) {
    td.when(transactionsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: transactionId });
    td.when(contractsDAL.countCommands(td.matchers.isA(String))).thenResolve(commandsCount);
    td.when(contractsDAL.deleteCommands(td.matchers.isA(String))).thenResolve(commandsCount);
    td.when(contractsDAL.getLastCommandOfTx(contract, txHashParam)).thenResolve(command);
  }
  await (async function getCommandsToInsert_shouldReturnAnArray() {
    before();
    stub();
    const result = await commandsAdder.getCommandsToInsert(CONTRACT_ID_1, 10);
    t.assert(Array.isArray(result), 'Should return an array');
    after();
  })();

  await (async function getCommandsToInsert_noCommandsInDB() {
    before();
    stub();
    const result = await commandsAdder.getCommandsToInsert(CONTRACT_ID_1, commandsData.length);
    t.equals(
      result.length,
      commandsData.length,
      'Given no commands in db: should get an array with all commands'
    );
    after();
  })();

  await (async function getCommandsToInsert_noCommandsInDBTakeLessThanLength() {
    before();
    stub();
    const result = await commandsAdder.getCommandsToInsert(CONTRACT_ID_1, CUSTOM_TAKE);
    t.equals(
      result.length,
      commandsData.length,
      'Given no commands in db and lower take than all: should get an array with all commands'
    );
    after();
  })();

  await (async function getCommandsToInsert_10CommandsInDB() {
    before();
    stub({ commandsCount: 10 });
    const result = await commandsAdder.getCommandsToInsert(CONTRACT_ID_1, CUSTOM_TAKE);
    t.equals(
      result.length,
      commandsData.length,
      'Given 10 commands in db: should get an array with all commands'
    );
    after();
  })();
});

test('CommandsAdder.getLastCommandTxIndexFromDb()', async function(t) {
  function stub({ contract = CONTRACT_ID_1, command = null } = {}) {
    td.when(contractsDAL.getLastCommandOfTx(contract, td.matchers.isA(String))).thenResolve(
      command
    );
  }
  await (async function getLastCommandTxInfoFromDb_nothingInDb() {
    before();
    stub();
    const indexInTransaction = await commandsAdder.getLastCommandTxIndexFromDb(
      CONTRACT_ID_1,
      '12345'
    );
    t.equals(indexInTransaction, -1, 'Given no commands in db: should get index -1');
    after();
  })();

  await (async function getLastCommandTxInfoFromDb_commandsInDb() {
    before();
    const txHashTest = '12345';
    stub({
      command: {
        indexInTransaction: 15,
      },
    });
    const indexInTransaction = await commandsAdder.getLastCommandTxIndexFromDb(
      CONTRACT_ID_1,
      txHashTest
    );
    t.equals(indexInTransaction, 15, 'Given a command in db: should get indexInTransaction');
    after();
  })();
});

test('CommandsAdder.mapNodeCommandsWithRelations()', async function(t) {
  function stub({ transactionId = 1 } = {}) {
    td.when(transactionsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: transactionId });
  }
  await (async function mapNodeCommandsWithRelations_shouldReturnAnArray() {
    before();
    stub();
    const result = await commandsAdder.mapNodeCommandsWithRelations(CONTRACT_ID_1, []);
    t.assert(Array.isArray(result), 'Should return an array');
    after();
  })();

  await (async function mapNodeCommandsWithRelations_emptyArray() {
    before();
    stub();
    const result = await commandsAdder.mapNodeCommandsWithRelations(CONTRACT_ID_1, []);
    t.equals(result.length, 0, 'Given  an empty commands array: should return an empty array');
    after();
  })();

  await (async function mapNodeCommandsWithRelations_commandsArray() {
    before();
    stub();
    const contractId = CONTRACT_ID_1;
    const result = await commandsAdder.mapNodeCommandsWithRelations(contractId, commandsData);
    t.equals(
      result.length,
      commandsData.length,
      'Given a commands array: should return an array with same length'
    );
    t.equals(
      result[0].TransactionId,
      1,
      'Given a commands array with txHash: should contain the transaction id'
    );
    t.equals(
      result[0].ContractId,
      contractId,
      'Given a commands array: should contain the contract id'
    );
    after();
  })();
});

test('CommandsAdder.shouldInsertCommands()', async function(t) {
  function stub({ commandsCount = 0, contract = CONTRACT_ID_1 } = {}) {
    td.when(contractsDAL.countCommands(contract)).thenResolve(commandsCount);
    td.when(contractsDAL.deleteCommands(contract)).thenResolve(commandsCount);
  }
  await (async function shouldInsertCommands_nothingInDb() {
    before();
    stub();
    const shouldInsert = await commandsAdder.shouldInsertCommands(CONTRACT_ID_1, []);
    t.equals(
      shouldInsert,
      false,
      'Given no commands in db and empty commands array: should return false'
    );
    after();
  })();
  await (async function shouldInsertCommands_sameAmountInDb() {
    before();
    stub({ commandsCount: 2 });
    const shouldInsert = await commandsAdder.shouldInsertCommands(CONTRACT_ID_1, [
      {
        command: '',
        messageBody: '',
        TransactionId: 1,
        indexInTransaction: 0,
        ContractId: '',
      },
      {
        command: '',
        messageBody: '',
        TransactionId: 1,
        indexInTransaction: 0,
        ContractId: '',
      },
    ]);
    t.equals(shouldInsert, false, 'Given same amount of commands in db: should return false');
    after();
  })();
  await (async function shouldInsertCommands_lessAmountInDb() {
    before();
    const commandsInDb = 1;
    stub({ commandsCount: commandsInDb });
    const shouldInsert = await commandsAdder.shouldInsertCommands(CONTRACT_ID_1, [
      {
        command: '',
        messageBody: '',
        TransactionId: 1,
        indexInTransaction: 0,
        ContractId: '',
      },
      {
        command: '',
        messageBody: '',
        TransactionId: 1,
        indexInTransaction: 0,
        ContractId: '',
      },
    ]);
    t.equals(shouldInsert, true, 'Given less amount of commands in db: should return true');
    after();
  })();
  await (async function shouldInsertCommands_biggerAmountInDb() {
    before();
    const commandsInDb = 2;
    stub({ commandsCount: commandsInDb });
    const shouldInsert = await commandsAdder.shouldInsertCommands(CONTRACT_ID_1, [
      {
        command: '',
        messageBody: '',
        TransactionId: 1,
        indexInTransaction: 0,
        ContractId: '',
      },
    ]);
    t.equals(shouldInsert, true, 'Given bigger amount of commands in db: should return true');
    after();
  })();
});
