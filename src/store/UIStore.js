import { observable, action, autorun, toJS, runInAction } from 'mobx';
import localStore from '../lib/localStore';
import Service from '../lib/Service';
import config from '../lib/Config';

export default function UIStore(rootStore) {
  const blockStore = rootStore.blockStore;
  const addressStore = rootStore.addressStore;
  const contractStore = rootStore.contractStore;
  const assetStore = rootStore.assetStore;

  const state = observable({
    syncing: false,

    blocksTable: {
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },

    blockTxTable: {
      hashOrBlockNumber: '0',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },

    addressTxAssetsTable: {
      address: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },

    addressTxsTable: {
      address: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },

    contractsTable: {
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
      sorted: [],
    },

    contractAssetsTable: {
      address: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },

    contractCommandsTable: {
      address: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },

    assetsTable: {
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },

    assetTxsTable: {
      asset: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },

    assetKeyholdersTable: {
      asset: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    },
  });

  const fetchSyncing = action(() => {
    return Service.infos
      .findByName('syncing')
      .then(response => {
        runInAction(() => {
          state.syncing = response.success && response.data.value === 'true';
        });
      })
      .catch(() => {});
  });

  const setBlocksTableData = action(setTableData({objectToSet: state.blocksTable}));
  const setBlockTxTableData = action(setTableData({nameOfIdentifier: 'hashOrBlockNumber', objectToSet: state.blockTxTable}));
  const setAddressTxAssetsTableData = action(setTableData({nameOfIdentifier: 'address', objectToSet: state.addressTxAssetsTable}));
  const setAddressTxsTableData = action(setTableData({nameOfIdentifier: 'address', objectToSet: state.addressTxsTable}));
  const setContractsTableData = action(setTableData({objectToSet: state.contractsTable}));
  const setContractAssetsTableData = action(setTableData({nameOfIdentifier: 'address', objectToSet: state.contractAssetsTable}));
  const setContractCommandsTableData = action(setTableData({nameOfIdentifier: 'address', objectToSet: state.contractCommandsTable}));
  const setAssetsTableData = action(setTableData({objectToSet: state.assetsTable}));
  const setAssetTxsTableData = action(setTableData({nameOfIdentifier: 'asset', objectToSet: state.assetTxsTable}));
  const setAssetKeyholdersTableData = action(setTableData({nameOfIdentifier: 'asset', objectToSet: state.assetKeyholdersTable}));

  const saveToStorage = action((state) => {
    localStore.set('ui-store', state);
  });

  const loadFromStorage = action(() => {
    const data = localStore.get('ui-store');
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key].pageSize && state[key]) {
          state[key].pageSize = data[key].pageSize;
        }
      });
    }
  });

  (function setAutoRuns() {
    let firstRun = true;
    autorun(() => {
      if (firstRun) {
        loadFromStorage();
      }
      saveToStorage(toJS(state)); // toJS makes this work for all inner properties
    });
    firstRun = false;

    autorun(function fetchBlocksOnChange() {
      if (state.blocksTable.curPage * state.blocksTable.pageSize < blockStore.blocksCount) {
        blockStore.fetchBlocks({
          page: state.blocksTable.curPage,
          pageSize: state.blocksTable.pageSize,
        });
      }
    });

    autorun(function runOnBlockChange() {
      blockStore.resetBlockTransactionAssets(state.blockTxTable.hashOrBlockNumber);
    });

    autorun(function fetchBlockTransactionAssetsOnChange() {
      if (hashOrBlockNumberNotEmpty(state.blockTxTable.hashOrBlockNumber)) {
        blockStore.fetchBlockTransactionAssets(state.blockTxTable.hashOrBlockNumber, {
          page: state.blockTxTable.curPage,
          pageSize: state.blockTxTable.pageSize,
        });
      }
    });

    autorun(function runOnAddressChange() {
      addressStore.resetAddressTransactionAssets(state.addressTxAssetsTable.address);
      addressStore.fetchAddress(state.addressTxAssetsTable.address);
    });

    autorun(function fetchAddressTxAssetsOnChange() {
      if (state.addressTxAssetsTable.address) {
        addressStore.fetchAddressTransactionAssets(state.addressTxAssetsTable.address, {
          page: state.addressTxAssetsTable.curPage,
          pageSize: state.addressTxAssetsTable.pageSize,
        });
      }
    });

    autorun(function fetchAddressTxsOnChange() {
      if (state.addressTxsTable.address) {
        addressStore.loadAddressTransactions(state.addressTxsTable.address, {
          page: state.addressTxsTable.curPage,
          pageSize: state.addressTxsTable.pageSize,
        });
      }
    });

    autorun(function fetchContractsOnChange() {
      if (
        state.contractsTable.curPage * state.contractsTable.pageSize <
        contractStore.contractsCount
      ) {
        contractStore.loadContracts({
          page: state.contractsTable.curPage,
          pageSize: state.contractsTable.pageSize,
          sorted: JSON.stringify(state.contractsTable.sorted),
        });
      }
    });

    autorun(function fetchContractAssetsOnChange() {
      if (state.contractAssetsTable.address) {
        contractStore.loadAssets(state.contractAssetsTable.address, {
          page: state.contractAssetsTable.curPage,
          pageSize: state.contractAssetsTable.pageSize,
        });
      }
    });

    autorun(function fetchContractCommandsOnChange() {
      if (state.contractCommandsTable.address) {
        contractStore.loadCommands(state.contractCommandsTable.address, {
          page: state.contractCommandsTable.curPage,
          pageSize: state.contractCommandsTable.pageSize,
        });
      }
    });

    autorun(function fetchAssetsOnChange() {
      if (state.assetsTable.curPage * state.assetsTable.pageSize < assetStore.assetsCount) {
        assetStore.loadAssets({
          page: state.assetsTable.curPage,
          pageSize: state.assetsTable.pageSize,
        });
      }
    });

    autorun(function fetchAssetTxsOnChange() {
      if (state.assetTxsTable.asset) {
        assetStore.loadAssetTxs(state.assetTxsTable.asset, {
          page: state.assetTxsTable.curPage,
          pageSize: state.assetTxsTable.pageSize,
        });
      }
    });

    autorun(function fetchAssetKeyholdersOnChange() {
      if (state.assetKeyholdersTable.asset) {
        assetStore.loadAssetKeyholders(state.assetKeyholdersTable.asset, {
          page: state.assetKeyholdersTable.curPage,
          pageSize: state.assetKeyholdersTable.pageSize,
        });
      }
    });
  })();

  return Object.freeze({
    setAddressTxAssetsTableData,
    setAddressTxsTableData,
    setAssetKeyholdersTableData,
    setAssetTxsTableData,
    setAssetsTableData,
    setBlockTxTableData,
    setBlocksTableData,
    setContractAssetsTableData,
    setContractCommandsTableData,
    setContractsTableData,
    fetchSyncing,
    state,
  });
}

function hashOrBlockNumberNotEmpty(hashOrBlockNumber) {
  return (
    typeof hashOrBlockNumber !== 'undefined' &&
    hashOrBlockNumber !== '' &&
    hashOrBlockNumber !== '0' &&
    hashOrBlockNumber !== 0
  );
}

/**
 * Creates a tableDataSetter function with a custom id name
 */
function setTableData({nameOfIdentifier, objectToSet} = {}) {
  return (params = {}) => {
    const id = nameOfIdentifier ? params[nameOfIdentifier] : null;
    const pageSize = params.pageSize;
    const curPage = params.curPage;
    const sorted = params.sorted;

    if (id && id !== objectToSet[nameOfIdentifier]) {
      objectToSet[nameOfIdentifier] = id;
      objectToSet.curPage = 0;
    }
    if (pageSize) {
      objectToSet.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      objectToSet.curPage = curPage;
    }
    if (sorted) {
      objectToSet.sorted = sorted;
    }
  };
}
