'use strict';

const test = require('blue-tape');
const td = require('testdouble');
const NetworkHelper = require('../../lib/NetworkHelper');
const commandsData = require('./test/data/commands.json');

const CONTRACT_ID_1 = '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b63';
const CONTRACT_ID_2 = '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b64';
const CUSTOM_TAKE = 10;

let commandsAdder;
let contractsDAL;
let transactionsDAL;
let commandsDAL;

function before() {
  contractsDAL = td.replace('../../../server/components/api/contracts/contractsDAL', {
    findAllActive: td.func('findAllActive'),
    countCommands: td.func('countCommands'),
    getCommands: td.func('getCommands'),
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

  const CommandsAdder = require('./CommandsAdder');
  commandsAdder = new CommandsAdder(new FakeNetworkHelper());
}
function after() {
  td.reset();
}

test('CommandsAdder.doJob()', async function(t) {
  function stub({activeContracts = [], commandsCount = 0, transactionId = 1} = {}) {
    td.when(contractsDAL.findAllActive()).thenResolve(activeContracts);
    td.when(contractsDAL.countCommands(td.matchers.isA(String))).thenResolve(commandsCount);
    td.when(transactionsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: transactionId });
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
    stub({activeContracts: [{ id: CONTRACT_ID_1 }]});
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

  await (async function doJob_oneContract_nothingInDd() {
    before();
    stub({activeContracts: [{ id: CONTRACT_ID_1 }]});
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(
      result,
      commandsData.length,
      'Given no data in db and 1 contract: should insert all commandsData'
    );
    after();
  })();

  await (async function doJob_severalContracts_nothingInDd() {
    before();
    stub({activeContracts: [
      { id: CONTRACT_ID_1 },
      { id: CONTRACT_ID_2 },
    ]});
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(
      result,
      commandsData.length * 2,
      'Given no data in db and 2 contracts: should insert all commandsData twice'
    );
    after();
  })();

  await (async function doJob_oneContract_someInDd() {
    before();
    const commandsAlreadyInDb = 10;
    stub({activeContracts: [{ id: CONTRACT_ID_1 }], commandsCount: commandsAlreadyInDb});
    const result = await commandsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(
      result,
      commandsData.length - commandsAlreadyInDb,
      `Given ${commandsAlreadyInDb} commands in db and 1 contract: should insert ${commandsData.length -
        commandsAlreadyInDb} commands`
    );
    after();
  })();
});

test('CommandsAdder.getCommandsToInsert()', async function(t) {
  function stub({transactionId = 1, commandsCount = 0} = {}) {
    td.when(transactionsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: transactionId });
    td.when(contractsDAL.countCommands(td.matchers.isA(String))).thenResolve(commandsCount);
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
    stub({commandsCount: 10});
    const result = await commandsAdder.getCommandsToInsert(CONTRACT_ID_1, CUSTOM_TAKE);
    t.equals(
      result.length,
      commandsData.length - 10,
      'Given 10 commands in db: should get an array with all commands minus 10'
    );
    after();
  })();
});

test('CommandsAdder.getLastCommandTxInfoFromDb()', async function(t) {
  function stub({contract = CONTRACT_ID_1,command = null} = {}) {
    td.when(contractsDAL.getCommands(contract, td.matchers.isA(Object))).thenResolve(command);
  }
  await (async function getLastCommandTxInfoFromDb_nothingInDb() {
    before();
    stub();
    const { txHash } = await commandsAdder.getLastCommandTxInfoFromDb(
      CONTRACT_ID_1
    );
    t.equals(txHash, '', 'Given no commands in db: should get an empty txHash');
    after();
  })();
  
  await (async function getLastCommandTxInfoFromDb_commandsInDb() {
    before();
    stub({command: {
      indexInTransaction: 15,
      Transaction: { hash: '123' },
    }});
    const { txHash, indexInTransaction } = await commandsAdder.getLastCommandTxInfoFromDb(
      CONTRACT_ID_1
    );
    t.equals(txHash, '123', 'Given a command in db: should get txHash');
    t.equals(indexInTransaction, 15, 'Given a command in db: should get indexInTransaction');
    after();
  })();
});


test('CommandsAdder.mapNodeCommandsWithRelations()', async function(t) {
  await (async function mapNodeCommandsWithRelations_shouldReturnAnArray() {
    before();
    const result = await commandsAdder.mapNodeCommandsWithRelations(CONTRACT_ID_1, [], '', 0);
    t.assert(Array.isArray(result), 'Should return an array');
    after();
  })();
  
  await (async function mapNodeCommandsWithRelations_emptyArray() {
    before();
    const result = await commandsAdder.mapNodeCommandsWithRelations(CONTRACT_ID_1, [], '', 0);
    t.equals(result.length, 0, 'Given  an empty commands array: should return an empty array');
    after();
  })();
  
  await (async function mapNodeCommandsWithRelations_commandsArray() {
    before();
    const contractId = CONTRACT_ID_1;
    td.when(transactionsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: 1 });
    const result = await commandsAdder.mapNodeCommandsWithRelations(contractId, commandsData, '', 0);
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
  
  await (async function mapNodeCommandsWithRelations_txIndex() {
    before();
    const data = [
      {
        command: 'buy',
        messageBody: '',
        txHash: '5e448f458710898d65ee03be21e7634fc4027f3d292f4fb5b77f4d06b7943164',
      },
      {
        command: 'buy',
        messageBody: '',
        txHash: '5e448f458710898d65ee03be21e7634fc4027f3d292f4fb5b77f4d06b7943164',
      },
      {
        command: 'buy',
        messageBody: '',
        txHash: '5e448f458710898d65ee03be21e7634fc4027f3d292f4fb5b77f4d06b7943164',
      },
      {
        command: 'buy',
        messageBody: '',
        txHash: '2afdae904fd21e11036ffd02a195645f3d98915fa395cfc5d577a407b4f4bb1e',
      },
      {
        command: 'buy',
        messageBody: '',
        txHash: '2afdae904fd21e11036ffd02a195645f3d98915fa395cfc5d577a407b4f4bb1e',
      },
    ];
    const contractId = CONTRACT_ID_1;
    td.when(transactionsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: 1 }); // doesn't matter
    const result = await commandsAdder.mapNodeCommandsWithRelations(contractId, data, '', 0);
    t.deepEqual(
      result.map(item => item.indexInTransaction),
      [0, 1, 2, 0, 1],
      'Given different tx hashes: should contain the right indexes in txs'
    );
  
    // continue next batch with same tx
    const result1 = await commandsAdder.mapNodeCommandsWithRelations(
      contractId,
      [
        {
          command: 'buy',
          messageBody: '',
          txHash: '2afdae904fd21e11036ffd02a195645f3d98915fa395cfc5d577a407b4f4bb1e',
        },
      ],
      '2afdae904fd21e11036ffd02a195645f3d98915fa395cfc5d577a407b4f4bb1e',
      1
    );
    t.deepEqual(
      result1.map(item => item.indexInTransaction),
      [2],
      'Given commands continue withe same tx: should contain the right indexes in txs'
    );
    after();
  })();
});

