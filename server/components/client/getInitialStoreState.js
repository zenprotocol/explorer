const blocksBLL = require('../api/blocks/blocksBLL');
const transactionsBLL = require('../api/transactions/transactionsBLL');
const addressesBLL = require('../api/addresses/addressesBLL');
const contractsBLL = require('../api/contracts/contractsBLL');
const assetsBLL = require('../api/assets/assetsBLL');
const infosBLL = require('../api/infos/infosBLL');

module.exports = async req => {
  const { routeName } = req;
  const initialState = {
    addressStore: {},
    assetStore: {},
    blockStore: {},
    contractStore: {},
    infoStore: {},
    searchStore: {},
    transactionStore: {},
    uiStore: {},
  };
  const promises = [];
  // blocks
  promises.push(blocksBLL.count().then(count => (initialState.blockStore.blocksCount = count)));

  const { page: curPage, pageSize } = safePaginationParams(req);

  switch (routeName) {
    case 'blocks':
      promises.push(getBlockListStoreData(req).then(data => (initialState.blockStore = data)));
      initialState.uiStore.blocksTable = { curPage, pageSize };
      break;
    case 'block':
      promises.push(getBlockStoreData(req).then(data => (initialState.blockStore = data)));
      break;
    case 'tx':
      promises.push(
        getTransactionStoreData(req).then(data => (initialState.transactionStore = data))
      );
      break;
    case 'address':
      promises.push(getAddressStoreData(req).then(data => (initialState.addressStore = data)));
      break;
    case 'contracts':
      promises.push(
        getContractListStoreData(req).then(data => (initialState.contractStore = data))
      );
      initialState.uiStore.contractsTable = { curPage, pageSize };
      break;
    case 'contract':
      promises.push(getContractStoreData(req).then(data => (initialState.contractStore = data)));
      promises.push(getAddressStoreData(req).then(data => (initialState.addressStore = data)));
      break;
    case 'assets':
      promises.push(getAssetListStoreData(req).then(data => (initialState.assetStore = data)));
      initialState.uiStore.assetsTable = { curPage, pageSize };
      break;
    case 'asset':
      promises.push(getAssetStoreData(req).then(data => (initialState.assetStore = data)));
      break;
    case 'info':
      promises.push(getInfoStoreData(req).then(data => (initialState.infoStore = data)));
      break;
  }

  await Promise.all(promises);
  return initialState;
};

async function getBlockListStoreData(req) {
  const { page, pageSize } = safePaginationParams(req);
  const result = await blocksBLL.findAllAndCount({ page, pageSize });
  return {
    blocks: result.items,
    blocksCount: result.count,
  };
}

async function getBlockStoreData(req) {
  const hashOrBlockNumber = req.params.hashOrBlockNumber;
  const block = await blocksBLL.findByHashOrBlockNumber({ hashOrBlockNumber: hashOrBlockNumber });
  return {
    block: block || { statue: 404 },
    hashOrBlockNumber,
  };
}

async function getTransactionStoreData(req) {
  const transaction = await transactionsBLL.findOne({ hash: req.params.hash });
  return {
    transaction,
  };
}

async function getAddressStoreData(req) {
  const address = await addressesBLL.findOne({ address: req.params.address });
  return {
    address: address || { statue: 404 },
  };
}

async function getContractListStoreData(req) {
  const { page, pageSize } = safePaginationParams(req);
  const result = await contractsBLL.findAll({ page, pageSize });
  return {
    // remove code, adds a lot of code to the page
    contracts: result.items,
    contractsCount: result.count,
  };
}

async function getContractStoreData(req) {
  const contract = await contractsBLL.findByAddress({ address: req.params.address });
  return {
    contract: contract || { statue: 404 },
  };
}

async function getAssetListStoreData(req) {
  const { page, pageSize } = safePaginationParams(req);
  const result = await assetsBLL.findAll({ page, pageSize });
  return {
    // remove code, adds a lot of code to the page
    assets: result.items,
    assetsCount: result.count,
  };
}

async function getAssetStoreData(req) {
  const asset = await assetsBLL.findOne({ asset: req.params.asset });
  return {
    asset: asset || { statue: 404 },
  };
}

async function getInfoStoreData() {
  const infos = await infosBLL.findAll();
  return {
    infos,
  };
}

function safePaginationParams(req) {
  const { p, s } = req.query;
  let safePage = Number(p);
  let safeSize = Number(s);
  return {
    page: isNaN(safePage) || safePage < 1 ? 0 : safePage - 1,
    pageSize: isNaN(safeSize) ? 10 : safeSize,
  };
}
