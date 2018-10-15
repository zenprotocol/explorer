'use strict';

const test = require('blue-tape');
const truncate = require('../../../common/test/truncate');
const NetworkHelper = require('../../lib/NetworkHelper');
const mock = require('./test/mock');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const ContractsAdder = require('./ContractsAdder');
const activeContractsMock = require('./test/data/activeContracts.json');
const convertContractToDbContract = require('./test/convertContractToDbContract');

function getMockedContractsAdder() {
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper);
  return new ContractsAdder(networkHelper);
}

test.onFinish(() => {
  contractsDAL.db.sequelize.close();
});

test('CONTRACTS ----------------------------------------------------------------------', async function() {});

test('Add new contracts When 0 in DB', async function(t) {
  await truncate();
  const contractsAdder = getMockedContractsAdder();

  await contractsAdder.doJob();
  const contracts = await contractsDAL.findAll();
  const numOfBlocksExpected = activeContractsMock.length;
  t.equal(contracts.length, numOfBlocksExpected, `There should be ${numOfBlocksExpected} contracts in the db`);
});

test('Add more contracts to existing ones', async function(t) {
  await truncate();
  const contractsAdder = getMockedContractsAdder();

  await contractsDAL.create({
    id: '1234',
    address: '5678',
    expiryBlock: 40000,
    code: 'nothing to test here',
  });

  await contractsAdder.doJob();
  const contracts = await contractsDAL.findAll();
  const numOfBlocksExpected = activeContractsMock.length + 1;
  t.equal(contracts.length, numOfBlocksExpected, `There should be ${numOfBlocksExpected} contracts in the db`);
});

test('Add contracts and update existing', async function(t) {
  await truncate();
  const contractsAdder = getMockedContractsAdder();

  await contractsDAL.create(convertContractToDbContract(activeContractsMock[0]));

  await contractsAdder.doJob();
  const contracts = await contractsDAL.findAll();
  const numOfBlocksExpected = activeContractsMock.length;
  t.equal(contracts.length, numOfBlocksExpected, `There should be ${numOfBlocksExpected} contracts in the db`);
});

test('Expire contract', async function(t) {
  await truncate();
  const contractsAdder = getMockedContractsAdder();

  // add to db
  await contractsDAL.create({
    id: '1234',
    address: '5678',
    expiryBlock: 40000,
    code: 'nothing to test here',
  });

  await contractsAdder.doJob();
  const contract = await contractsDAL.findById('1234');

  t.equal(contract.expiryBlock, null, 'expiryBlock should be null');
});

test('Extend contract', async function(t) {
  await truncate();
  const contractsAdder = getMockedContractsAdder();

  // add to db
  await contractsDAL.create({
    id: '1234',
    address: '5678',
    expiryBlock: 40000,
    code: 'nothing to test here',
  });

  await contractsAdder.doJob();
  const contract = await contractsDAL.findById('1234');

  t.equal(contract.expiryBlock, null, 'expiryBlock should be null');
});

test('Re activate contract', async function(t) {
  await truncate();
  const contractsAdder = getMockedContractsAdder();

  const contractValues = convertContractToDbContract(activeContractsMock[0]);
  const expiryBlockExpected = contractValues.expiryBlock;
  contractValues.expiryBlock = null;
  await contractsDAL.create(contractValues);
  
  await contractsAdder.doJob();
  const contract = await contractsDAL.findById(contractValues.id);
  t.equal(contract.expiryBlock, expiryBlockExpected, 'expiryBlock should not be null');
});

