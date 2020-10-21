'use strict';

const R = require('ramda');
const test = require('blue-tape');
const td = require('testdouble');
const NetworkHelper = require('../../lib/NetworkHelper');
const executionsData = require('./test/data/executions.json');

const CONTRACT_ID_1 = '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b63';
const CONTRACT_ID_2 = '00000000f24db32aa1881956646d3ccbb647df71455de10cf98b635810e8870906a56b64';
const CUSTOM_TAKE = 10;
const LATEST_BLOCK_NUMBER = 40000; // check if the db is synced
const numOfExecutionsWithConfirmations = R.filter(execution => execution.confirmations > 0, executionsData)
  .length;

let executionsAdder;
let blocksDAL;
let contractsDAL;
let txsDAL;
let executionsDAL;
let fakeNetworkHelper;

function before({ numOfExecutionsInDb = 0 } = {}) {
  blocksDAL = td.replace('../../../server/components/api/blocks/blocksDAL', {
    findLatest: td.func('findLatest'),
  });
  contractsDAL = td.replace('../../../server/components/api/contracts/contractsDAL', {
    findAll: td.func('findAll'),
    findAllActive: td.func('findAllActive'),
    countExecutions: td.func('countExecutions'),
    getLastExecutionOfTx: td.func('getLastExecutionOfTx'),
  });
  txsDAL = td.replace('../../../server/components/api/txs/txsDAL.js', {
    findOne: td.func('findOne'),
  });
  executionsDAL = td.replace('../../../server/components/api/executions/executionsDAL.js', {
    bulkCreate: td.func('bulkCreate'),
  });
  const FakeNetworkHelper = td.constructor(NetworkHelper);
  // return the same executions for all contracts
  const dataToReturn = JSON.parse(JSON.stringify(executionsData));
  [CONTRACT_ID_1, CONTRACT_ID_2].forEach(contractId => {
    td.when(
      FakeNetworkHelper.prototype.getContractExecutionsFromNode({
        contractId,
        skip: 0,
        take: dataToReturn.length,
      })
    ).thenResolve(dataToReturn);
    td.when(
      FakeNetworkHelper.prototype.getContractExecutionsFromNode({
        contractId,
        skip: dataToReturn.length,
        take: dataToReturn.length,
      })
    ).thenResolve([]);

    for (let skip = 0; skip < dataToReturn.length; skip += CUSTOM_TAKE) {
      td.when(
        FakeNetworkHelper.prototype.getContractExecutionsFromNode({
          contractId,
          skip: skip,
          take: CUSTOM_TAKE,
        })
      ).thenResolve(dataToReturn.slice(skip, skip + CUSTOM_TAKE));
    }

    if (numOfExecutionsInDb) {
      // stub the first take
      td.when(
        FakeNetworkHelper.prototype.getContractExecutionsFromNode({
          contractId,
          skip: numOfExecutionsInDb,
          take: CUSTOM_TAKE,
        })
      ).thenResolve(dataToReturn.slice(numOfExecutionsInDb, numOfExecutionsInDb + CUSTOM_TAKE));

      for (
        let skip = CUSTOM_TAKE;
        skip + numOfExecutionsInDb < dataToReturn.length;
        skip += CUSTOM_TAKE
      ) {
        td.when(
          FakeNetworkHelper.prototype.getContractExecutionsFromNode({
            contractId,
            skip: numOfExecutionsInDb + skip,
            take: CUSTOM_TAKE,
          })
        ).thenResolve(
          dataToReturn.slice(skip + numOfExecutionsInDb, skip + numOfExecutionsInDb + CUSTOM_TAKE)
        );
      }
    }
  });
  td.when(FakeNetworkHelper.prototype.getLatestBlockNumberFromNode()).thenResolve(
    LATEST_BLOCK_NUMBER
  );

  const ExecutionsAdder = require('./ExecutionsAdder');
  fakeNetworkHelper = new FakeNetworkHelper();
  executionsAdder = new ExecutionsAdder(fakeNetworkHelper);
}
function after() {
  td.reset();
}

test('ExecutionsAdder.doJob()', async function(t) {
  function stub({
    allContracts = [],
    activeContracts = [],
    executionsCount = 0,
    transactionId = 1,
    latestBlockNumber = LATEST_BLOCK_NUMBER,
  } = {}) {
    td.when(contractsDAL.findAll()).thenResolve(allContracts);
    td.when(contractsDAL.findAllActive()).thenResolve(activeContracts);
    td.when(contractsDAL.countExecutions(td.matchers.anything())).thenResolve(executionsCount);
    td.when(txsDAL.findOne(td.matchers.anything())).thenResolve({ id: transactionId, blockNumber: latestBlockNumber });
    td.when(blocksDAL.findLatest()).thenResolve({ blockNumber: latestBlockNumber });
  }

  await (async function doJob_shouldCallBulkCreate() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], allContracts: [{ id: CONTRACT_ID_1 }] });
    await executionsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    try {
      td.verify(executionsDAL.bulkCreate(td.matchers.isA(Array)));
      t.pass('Should call executionsDAL.bulkCreate');
    } catch (error) {
      console.log(error);
      t.fail('Should call executionsDAL.bulkCreate');
    }
    after();
  })();

  await (async function doJob_dbNotSynced() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], allContracts: [{ id: CONTRACT_ID_1 }], latestBlockNumber: LATEST_BLOCK_NUMBER - 1 });
    const result = await executionsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(result, 0, 'Given a not synced db: should not insert anything');
    after();
  })();

  await (async function doJob_oneContract_nothingInDb() {
    before();
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], allContracts: [{ id: CONTRACT_ID_1 }] });
    const result = await executionsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(
      result,
      numOfExecutionsWithConfirmations,
      'Given a synced db, no executions data and 1 contract: should insert all executions which have confirmations'
    );
    after();
  })();

  await (async function doJob_severalContracts_nothingInDb() {
    before();
    stub({
      activeContracts: [{ id: CONTRACT_ID_1 }, { id: CONTRACT_ID_2 }],
      allContracts: [{ id: CONTRACT_ID_1 }, { id: CONTRACT_ID_2 }],
    });
    const result = await executionsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(
      result,
      numOfExecutionsWithConfirmations * 2,
      'Given no data in db and 2 contracts: should insert all executions which have confirmations twice'
    );
    after();
  })();

  await (async function doJob_oneContract_lessInDb() {
    const numOfExecutionsInDb = numOfExecutionsWithConfirmations - 1;
    before({ numOfExecutionsInDb });
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], allContracts: [{ id: CONTRACT_ID_1 }], executionsCount: numOfExecutionsInDb });
    const result = await executionsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(result, 1, 'Given less data in db: should insert only the new executions');
    after();
  })();

  await (async function doJob_oneContract_sameInDb() {
    const numOfExecutionsInDb = numOfExecutionsWithConfirmations;
    before({ numOfExecutionsInDb });
    stub({ activeContracts: [{ id: CONTRACT_ID_1 }], allContracts: [{ id: CONTRACT_ID_1 }], executionsCount: numOfExecutionsInDb });
    const result = await executionsAdder.doJob({ data: { take: CUSTOM_TAKE } });
    t.equal(result, 0, 'Given same data in db: should not insert anything');
    after();
  })();

  await (async function doJob_severalContracts_notAllActive_JobTypeRapid() {
    before();
    stub({
      activeContracts: [{ id: CONTRACT_ID_1 }],
      allContracts: [{ id: CONTRACT_ID_1 }, { id: CONTRACT_ID_2 }],
    });
    const result = await executionsAdder.doJob({ data: { take: CUSTOM_TAKE, type: 'rapid' } });
    t.equal(
      result,
      numOfExecutionsWithConfirmations,
      'Given some non active contracts and job type = rapid: should insert executions for the active contracts only'
    );
    after();
  })();
  await (async function doJob_severalContracts_notAllActive_JobTypeExpensive() {
    before();
    stub({
      activeContracts: [{ id: CONTRACT_ID_1 }],
      allContracts: [{ id: CONTRACT_ID_1 }, { id: CONTRACT_ID_2 }],
    });
    const result = await executionsAdder.doJob({ data: { take: CUSTOM_TAKE, type: 'expensive' } });
    t.equal(
      result,
      numOfExecutionsWithConfirmations * 2,
      'Given some non active contracts and job type = expensive: should insert executions for all contracts'
    );
    after();
  })();
});

test('ExecutionsAdder.getExecutionsToInsert()', async function(t) {
  function stub({
    contract = CONTRACT_ID_1,
    transactionId = 1,
    executionsCount = 0,
    execution = null,
    txHashParam = td.matchers.isA(String),
  } = {}) {
    td.when(txsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: transactionId });
    td.when(contractsDAL.countExecutions(td.matchers.isA(String))).thenResolve(executionsCount);
    td.when(contractsDAL.getLastExecutionOfTx(contract, txHashParam)).thenResolve(execution);
  }
  await (async function getExecutionsToInsert_shouldReturnAnArray() {
    before();
    stub();
    const result = await executionsAdder.getExecutionsToInsert(CONTRACT_ID_1, 10);
    t.assert(Array.isArray(result), 'Should return an array');
    after();
  })();

  await (async function getExecutionsToInsert_noExecutionsInDB() {
    before();
    stub();
    const result = await executionsAdder.getExecutionsToInsert(CONTRACT_ID_1, executionsData.length);
    t.equals(
      result.length,
      numOfExecutionsWithConfirmations,
      'Given no executions in db: should get an array with all executions that have confirmations'
    );
    after();
  })();

  await (async function getExecutionsToInsert_noExecutionsInDBTakeLessThanLength() {
    before();
    stub();
    const result = await executionsAdder.getExecutionsToInsert(CONTRACT_ID_1, CUSTOM_TAKE);
    t.equals(
      result.length,
      numOfExecutionsWithConfirmations,
      'Given no executions in db and lower take than all: should get an array with all executions'
    );
    after();
  })();

  await (async function getExecutionsToInsert_10ExecutionsInDB() {
    before();
    stub({ executionsCount: 10 });
    const result = await executionsAdder.getExecutionsToInsert(CONTRACT_ID_1, CUSTOM_TAKE);
    t.equals(
      result.length,
      numOfExecutionsWithConfirmations - 10,
      'Given 10 executions in db: should get an array with rest of executions excluding those with no confirmations'
    );
    after();
  })();
});

test('ExecutionsAdder.getLastExecutionTxIndexFromDb()', async function(t) {
  function stub({ contract = CONTRACT_ID_1, execution = null } = {}) {
    td.when(contractsDAL.getLastExecutionOfTx(contract, td.matchers.isA(String))).thenResolve(
      execution
    );
  }
  await (async function getLastExecutionTxInfoFromDb_nothingInDb() {
    before();
    stub();
    const indexInTx = await executionsAdder.getLastExecutionTxIndexFromDb(
      CONTRACT_ID_1,
      '12345'
    );
    t.equals(indexInTx, -1, 'Given no executions in db: should get index -1');
    after();
  })();

  await (async function getLastExecutionTxInfoFromDb_executionsInDb() {
    before();
    const txHashTest = '12345';
    stub({
      execution: {
        indexInTx: 15,
      },
    });
    const indexInTx = await executionsAdder.getLastExecutionTxIndexFromDb(
      CONTRACT_ID_1,
      txHashTest
    );
    t.equals(indexInTx, 15, 'Given a execution in db: should get indexInTx');
    after();
  })();
});

test('ExecutionsAdder.mapNodeExecutionsWithRelations()', async function(t) {
  function stub({ transactionId = 1 } = {}) {
    td.when(txsDAL.findOne(td.matchers.isA(Object))).thenResolve({ id: transactionId });
  }
  await (async function mapNodeExecutionsWithRelations_shouldReturnAnArray() {
    before();
    stub();
    const result = await executionsAdder.mapNodeExecutionsWithRelations(CONTRACT_ID_1, []);
    t.assert(Array.isArray(result), 'Should return an array');
    after();
  })();

  await (async function mapNodeExecutionsWithRelations_emptyArray() {
    before();
    stub();
    const result = await executionsAdder.mapNodeExecutionsWithRelations(CONTRACT_ID_1, []);
    t.equals(result.length, 0, 'Given  an empty executions array: should return an empty array');
    after();
  })();

  await (async function mapNodeExecutionsWithRelations_executionsArray() {
    before();
    stub();
    const contractId = CONTRACT_ID_1;
    const result = await executionsAdder.mapNodeExecutionsWithRelations(contractId, executionsData);
    t.equals(
      result.length,
      executionsData.length,
      'Given a executions array: should return an array with same length'
    );
    t.equals(
      result[0].txId,
      1,
      'Given a executions array with txHash: should contain the transaction id'
    );
    t.equals(
      result[0].contractId,
      contractId,
      'Given a executions array: should contain the contract id'
    );
    after();
  })();
});
