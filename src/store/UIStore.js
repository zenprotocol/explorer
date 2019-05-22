import { observable, action, autorun, toJS, runInAction } from 'mobx';
import localStore from '../lib/localStore';
import Service from '../lib/Service';
import config from '../lib/Config';
import ObjectUtils from '../lib/ObjectUtils';

export default function UIStore(rootStore, initialState = {}) {
  const blockStore = rootStore.blockStore;
  const addressStore = rootStore.addressStore;
  const contractStore = rootStore.contractStore;
  const assetStore = rootStore.assetStore;
  const repoVoteStore = rootStore.repoVoteStore;

  const defaultValues = defaultValuesFactory(initialState);
  const state = observable({
    syncing: false,

    blocksTable: {
      force: 1,
      pageSize: defaultValues.get('blocksTable.pageSize'),
      curPage: defaultValues.get('blocksTable.curPage'),
    },

    blockTxTable: {
      force: 1,
      hashOrBlockNumber: defaultValues.get('blockTxTable.hashOrBlockNumber', '0'),
      pageSize: defaultValues.get('blockTxTable.pageSize'),
      curPage: defaultValues.get('blockTxTable.curPage'),
    },

    blockContractsTable: {
      force: 1,
      blockNumber: defaultValues.get('blockContractsTable.blockNumber', 0),
      pageSize: defaultValues.get('blockContractsTable.pageSize'),
      curPage: defaultValues.get('blockContractsTable.curPage'),
      sorted: defaultValues.get('blockContractsTable.sorted'),
    },

    addressTxAssetsTable: {
      force: 1,
      address: defaultValues.get('addressTxAssetsTable.address'),
      pageSize: defaultValues.get('addressTxAssetsTable.pageSize'),
      curPage: defaultValues.get('addressTxAssetsTable.curPage'),
    },

    addressTxsTable: {
      force: 1,
      address: defaultValues.get('addressTxsTable.address'),
      pageSize: defaultValues.get('addressTxsTable.pageSize'),
      curPage: defaultValues.get('addressTxsTable.curPage'),
    },

    contractsTable: {
      force: 1,
      pageSize: defaultValues.get('contractsTable.pageSize'),
      curPage: defaultValues.get('contractsTable.curPage'),
      sorted: defaultValues.get('contractsTable.sorted'),
    },

    contractAssetsTable: {
      force: 1,
      address: defaultValues.get('contractAssetsTable.address'),
      pageSize: defaultValues.get('contractAssetsTable.pageSize'),
      curPage: defaultValues.get('contractAssetsTable.curPage'),
    },

    contractCommandsTable: {
      force: 1,
      address: defaultValues.get('contractCommandsTable.address'),
      pageSize: defaultValues.get('contractCommandsTable.pageSize'),
      curPage: defaultValues.get('contractCommandsTable.curPage'),
    },

    assetsTable: {
      force: 1,
      pageSize: defaultValues.get('assetsTable.pageSize'),
      curPage: defaultValues.get('assetsTable.curPage'),
    },

    assetTxsTable: {
      force: 1,
      asset: defaultValues.get('assetTxsTable.asset'),
      pageSize: defaultValues.get('assetTxsTable.pageSize'),
      curPage: defaultValues.get('assetTxsTable.curPage'),
    },

    assetKeyholdersTable: {
      force: 1,
      asset: defaultValues.get('assetKeyholdersTable.asset'),
      pageSize: defaultValues.get('assetKeyholdersTable.pageSize'),
      curPage: defaultValues.get('assetKeyholdersTable.curPage'),
    },

    repoVotesTable: {
      force: 1,
      interval: defaultValues.get('repoVotesTable.interval'),
      pageSize: defaultValues.get('repoVotesTable.pageSize'),
      curPage: defaultValues.get('repoVotesTable.curPage'),
    },

    repoVoteResultsTable: {
      force: 1,
      interval: defaultValues.get('repoVoteResultsTable.interval'),
      pageSize: defaultValues.get('repoVoteResultsTable.pageSize'),
      curPage: defaultValues.get('repoVoteResultsTable.curPage'),
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

  const setBlocksTableData = action(setTableData({ objectToSet: state.blocksTable }));
  const setBlockTxTableData = action(
    setTableData({ nameOfIdentifier: 'hashOrBlockNumber', objectToSet: state.blockTxTable })
  );
  const setBlockContractsTableData = action(
    setTableData({ nameOfIdentifier: 'blockNumber', objectToSet: state.blockContractsTable })
  );
  const setAddressTxAssetsTableData = action(
    setTableData({ nameOfIdentifier: 'address', objectToSet: state.addressTxAssetsTable })
  );
  const setAddressTxsTableData = action(
    setTableData({ nameOfIdentifier: 'address', objectToSet: state.addressTxsTable })
  );
  const setContractsTableData = action(setTableData({ objectToSet: state.contractsTable }));
  const setContractAssetsTableData = action(
    setTableData({ nameOfIdentifier: 'address', objectToSet: state.contractAssetsTable })
  );
  const setContractCommandsTableData = action(
    setTableData({ nameOfIdentifier: 'address', objectToSet: state.contractCommandsTable })
  );
  const setAssetsTableData = action(setTableData({ objectToSet: state.assetsTable }));
  const setAssetTxsTableData = action(
    setTableData({ nameOfIdentifier: 'asset', objectToSet: state.assetTxsTable })
  );
  const setAssetKeyholdersTableData = action(
    setTableData({ nameOfIdentifier: 'asset', objectToSet: state.assetKeyholdersTable })
  );
  const setRepoVotesTableData = action(
    setTableData({ nameOfIdentifier: 'interval', objectToSet: state.repoVotesTable })
  );
  const setRepoVoteResultsTableData = action(
    setTableData({ nameOfIdentifier: 'interval', objectToSet: state.repoVoteResultsTable })
  );

  const saveToStorage = action(state => {
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

    autorun(function fetchBlockContractsOnChange() {
      if (
        !isNaN(Number(state.blockContractsTable.blockNumber)) &&
        Number(state.blockContractsTable.blockNumber) > 0
      ) {
        blockStore.fetchBlockContracts(state.blockContractsTable.blockNumber, {
          page: state.blockContractsTable.curPage,
          pageSize: state.blockContractsTable.pageSize,
          sorted: JSON.stringify(state.blockContractsTable.sorted),
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

    autorun(function fetchRepoVotesOnChange() {
      if (state.repoVotesTable.interval !== '' && state.repoVotesTable.force > 0) {
        repoVoteStore.loadVotes(
          Object.assign(
            {},
            {
              page: state.repoVotesTable.curPage,
              pageSize: state.repoVotesTable.pageSize,
            },
            state.repoVotesTable.interval && { interval: state.repoVotesTable.interval }
          )
        );
      }
    });

    autorun(function fetchRepoVoteResultsOnChange() {
      if (state.repoVoteResultsTable.interval !== '' && state.repoVoteResultsTable.force > 0) {
        repoVoteStore.loadResults(
          Object.assign(
            {},
            {
              page: state.repoVoteResultsTable.curPage,
              pageSize: state.repoVoteResultsTable.pageSize,
            },
            state.repoVoteResultsTable.interval && { interval: state.repoVoteResultsTable.interval }
          )
        );
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
    setBlockContractsTableData,
    setBlocksTableData,
    setContractAssetsTableData,
    setContractCommandsTableData,
    setContractsTableData,
    setRepoVotesTableData,
    setRepoVoteResultsTableData,
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
function setTableData({ nameOfIdentifier, objectToSet } = {}) {
  return (params = {}) => {
    const id = nameOfIdentifier ? params[nameOfIdentifier] : null;
    const pageSize = params.pageSize;
    const curPage = params.curPage;
    const sorted = params.sorted;
    const force = params.force; // a boolean to force an update

    if (id && id !== objectToSet[nameOfIdentifier]) {
      const prevId = objectToSet[nameOfIdentifier];
      objectToSet[nameOfIdentifier] = id;
      // When resetting the curPage when this is the first set, it can interfere other objects which try to set the page as well
      if (prevId) {
        objectToSet.curPage = 0;
      }
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
    if(force) {
      objectToSet.force = objectToSet.force + 1;
    }
  };
}

/**
 * Creates an object with a get function to return a default for a table key
 * First by initialState, then by general default
 */
function defaultValuesFactory(initialState) {
  const defaults = {
    pageSize: config.ui.table.defaultPageSize,
    curPage: 0,
    sorted: [],
    id: '',
  };

  function getDefaultByAccessor(accessor) {
    const path = accessor.split('.');
    const key = path[path.length - 1];
    return typeof defaults[key] !== 'undefined' ? defaults[key] : defaults.id;
  }

  return {
    /**
     * Get a default value from state, supplied default or common default by that order
     */
    get(accessor, defaultVal) {
      const stateVal = ObjectUtils.getSafeProperty(initialState, accessor);
      return stateVal || defaultVal || getDefaultByAccessor(accessor);
    },
  };
}
