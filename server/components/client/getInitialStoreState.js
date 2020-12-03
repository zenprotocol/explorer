const blocksBLL = require('../api/blocks/blocksBLL');
const txsBLL = require('../api/txs/txsBLL');
const addressesBLL = require('../api/addresses/addressesBLL');
const contractsBLL = require('../api/contracts/contractsBLL');
const assetsBLL = require('../api/assets/assetsBLL');
const infosBLL = require('../api/infos/infosBLL');
const repoVotesBLL = require('../api/repovotes/repoVotesBLL');
const interval1CacheBLL = require('../api/repovotes/cache/1/interval1CacheBLL');
const cgpBLL = require('../api/cgp/cgpBLL');
const getChain = require('../../lib/getChain');

module.exports = async (req) => {
  const { routeName } = req;
  const initialState = {
    addressStore: {},
    assetStore: {},
    blockStore: {},
    contractStore: {},
    infoStore: {},
    searchStore: {},
    transactionStore: {},
    repoVoteStore: {},
    cgpStore: {},
    uiStore: {},
  };
  const promises = [];
  // blocks
  promises.push(blocksBLL.count().then((count) => (initialState.blockStore.blocksCount = count)));
  // info
  promises.push(getInfoStoreData(req).then((data) => (initialState.infoStore = data)));

  const { page: curPage, pageSize } = safePaginationParams(req);
  switch (routeName) {
    case 'blocks':
      promises.push(getBlockListStoreData(req).then((data) => (initialState.blockStore = data)));
      initialState.uiStore.blocksTable = { curPage, pageSize };
      break;
    case 'block':
      promises.push(getBlockStoreData(req).then((data) => (initialState.blockStore = data)));
      break;
    case 'tx':
      promises.push(
        getTransactionStoreData(req).then((data) => (initialState.transactionStore = data))
      );
      break;
    case 'address':
      promises.push(getAddressStoreData(req).then((data) => (initialState.addressStore = data)));
      break;
    case 'contracts':
      promises.push(
        getContractListStoreData(req).then((data) => (initialState.contractStore = data))
      );
      initialState.uiStore.contractsTable = { curPage, pageSize };
      break;
    case 'contract':
      promises.push(getContractStoreData(req).then((data) => (initialState.contractStore = data)));
      promises.push(getAddressStoreData(req).then((data) => (initialState.addressStore = data)));
      break;
    case 'assets':
      promises.push(getAssetListStoreData(req).then((data) => (initialState.assetStore = data)));
      initialState.uiStore.assetsTable = { curPage, pageSize };
      break;
    case 'asset':
      promises.push(getAssetStoreData(req).then((data) => (initialState.assetStore = data)));
      break;
    case 'governance':
      promises.push(getRepoVoteStoreData(req).then((data) => (initialState.repoVoteStore = data)));
      break;
    case 'cgp':
      promises.push(getCGPStoreData(req).then((data) => (initialState.cgpStore = data)));
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
  const transaction = await txsBLL.findOne({ hash: req.params.hash });
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
  if (!contract) {
    return {
      contract: { statue: 404 },
    };
  }

  return {
    contract,
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

async function getRepoVoteStoreData(req) {
  const [
    relevantInterval,
    recentIntervals,
    chain,
  ] = await Promise.all([
    repoVotesBLL.findIntervalAndTally(req.params),
    repoVotesBLL.findRecentIntervals(),
    getChain(),
  ]);
  const interval1Cache = interval1CacheBLL.relevantInterval();
  const shouldUseCache = (relevantInterval || {}).interval == 1 && chain === 'main';
  return {
    relevantInterval: shouldUseCache ? interval1Cache : relevantInterval,
    recentIntervals,
  };
}

async function getCGPStoreData(req) {
  // change interval to real one when requesting and to ui one when sending
  const chain = await getChain();
  const relevantInterval = await cgpBLL.findIntervalAndTally(
    Object.assign({}, req.params, { interval: uiIntervalToServer(chain, req.params.interval) })
  );
  return {
    relevantInterval: Object.assign({}, relevantInterval, {
      interval: serverIntervalToUi(chain, relevantInterval.interval),
    }),
  };
}
// CGP helpers ------
function serverIntervalToUi(chain, interval) {
  return chain === 'main' ? Number(interval) - 24 : Number(interval) - 1413;
}
function uiIntervalToServer(chain, interval) {
  if (Number(interval) === 0) return 0;
  return chain === 'main' ? Number(interval) + 24 : Number(interval) + 1413;
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
