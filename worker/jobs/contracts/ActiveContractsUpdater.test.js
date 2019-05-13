'use strict';

const test = require('blue-tape');
const truncate = require('../../../test/lib/truncate');
const NetworkHelper = require('../../lib/NetworkHelper');
const mock = require('./test/mock');
const contractsDAL = require('../../../server/components/api/contracts/contractsDAL');
const ActiveContractsUpdater = require('./ActiveContractsUpdater');
const activeContractsMock = require('./test/data/activeContracts.json');
const convertContractToDbContract = require('./test/convertContractToDbContract');

function getMockedActiveContractsUpdater() {
  const networkHelper = new NetworkHelper();
  mock.mockNetworkHelper(networkHelper);
  return new ActiveContractsUpdater(networkHelper);
}

async function addAllMocksToDb(expiryBlock = null) {
  for (let i = 0; i < activeContractsMock.length; i++) {
    const nodeContract = activeContractsMock[i];
    const contractValues = convertContractToDbContract(nodeContract);
    contractValues.expiryBlock = expiryBlock;
    await contractsDAL.create(contractValues);
  }
}

test.onFinish(() => {
  contractsDAL.db.sequelize.close();
});

test('ActiveContractsUpdater.doJob()', async function(t) {
  await givenNoContractsInDb(t);
  await givenAllContractsInDbWithNull(t);
  await givenContractInDbButNotInACS(t);
  await extendContracts(t);
});

async function givenNoContractsInDb(t) {
  await truncate();
  const activeContractsUpdater = getMockedActiveContractsUpdater();

  t.equal(await activeContractsUpdater.doJob(), 0, 'Given no contracts in db: Should not update contracts');
}

async function givenAllContractsInDbWithNull(t) {
  await truncate();
  const activeContractsUpdater = getMockedActiveContractsUpdater();
  await addAllMocksToDb();
  t.equal(
    await activeContractsUpdater.doJob(),
    activeContractsMock.length,
    'Given contracts in db with null expire: Should update all contracts'
  );
}

async function givenContractInDbButNotInACS(t) {
  await truncate();
  const activeContractsUpdater = getMockedActiveContractsUpdater();
  await contractsDAL.create({
    id: '1234',
    address: '5678',
    expiryBlock: 40000,
    code: 'nothing to test here',
  });

  await activeContractsUpdater.doJob();
  const contract = await contractsDAL.findById('1234');
  t.equal(
    contract.expiryBlock,
    null,
    'Given a contract in db but not in ACS: expiryBlock should be null'
  );
}

async function extendContracts(t) {
  await truncate();
  const activeContractsUpdater = getMockedActiveContractsUpdater();
  await addAllMocksToDb(100);
  t.equal(
    await activeContractsUpdater.doJob(),
    activeContractsMock.length,
    'Given all contracts with smaller expire: should extend all contracts'
  );
  const contract = await contractsDAL.findById(activeContractsMock[0].contractId);
  t.equal(
    contract.expiryBlock,
    activeContractsMock[0].expire,
    'Given a contract with a smaller expire: should extent the contract'
  );
}
