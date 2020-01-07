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
  const cgpStore = rootStore.cgpStore;

  const defaultValues = defaultValuesFactory(initialState);
  const state = observable({
    syncing: 'synced',

    blocksTable: {
      force: 1,
      pageSize: defaultValues.get('blocksTable.pageSize'),
      curPage: defaultValues.get('blocksTable.curPage')
    },

    blockTxTable: {
      force: 1,
      hashOrBlockNumber: defaultValues.get(
        'blockTxTable.hashOrBlockNumber',
        '0'
      ),
      pageSize: defaultValues.get('blockTxTable.pageSize'),
      curPage: defaultValues.get('blockTxTable.curPage')
    },

    blockContractsTable: {
      force: 1,
      blockNumber: defaultValues.get('blockContractsTable.blockNumber', 0),
      pageSize: defaultValues.get('blockContractsTable.pageSize'),
      curPage: defaultValues.get('blockContractsTable.curPage'),
      sorted: defaultValues.get('blockContractsTable.sorted')
    },

    addressTxAssetsTable: {
      force: 1,
      address: defaultValues.get('addressTxAssetsTable.address'),
      pageSize: defaultValues.get('addressTxAssetsTable.pageSize'),
      curPage: defaultValues.get('addressTxAssetsTable.curPage')
    },

    addressTxsTable: {
      force: 1,
      address: defaultValues.get('addressTxsTable.address'),
      pageSize: defaultValues.get('addressTxsTable.pageSize'),
      curPage: defaultValues.get('addressTxsTable.curPage')
    },

    contractsTable: {
      force: 1,
      pageSize: defaultValues.get('contractsTable.pageSize'),
      curPage: defaultValues.get('contractsTable.curPage'),
      sorted: defaultValues.get('contractsTable.sorted')
    },

    contractAssetsTable: {
      force: 1,
      address: defaultValues.get('contractAssetsTable.address'),
      pageSize: defaultValues.get('contractAssetsTable.pageSize'),
      curPage: defaultValues.get('contractAssetsTable.curPage')
    },

    contractCommandsTable: {
      force: 1,
      address: defaultValues.get('contractCommandsTable.address'),
      pageSize: defaultValues.get('contractCommandsTable.pageSize'),
      curPage: defaultValues.get('contractCommandsTable.curPage')
    },

    assetsTable: {
      force: 1,
      pageSize: defaultValues.get('assetsTable.pageSize'),
      curPage: defaultValues.get('assetsTable.curPage')
    },

    assetTxsTable: {
      force: 1,
      asset: defaultValues.get('assetTxsTable.asset'),
      pageSize: defaultValues.get('assetTxsTable.pageSize'),
      curPage: defaultValues.get('assetTxsTable.curPage')
    },

    assetKeyholdersTable: {
      force: 1,
      asset: defaultValues.get('assetKeyholdersTable.asset'),
      pageSize: defaultValues.get('assetKeyholdersTable.pageSize'),
      curPage: defaultValues.get('assetKeyholdersTable.curPage')
    },

    repoVotesTable: {
      force: 1,
      interval: defaultValues.get('repoVotesTable.interval'),
      phase: defaultValues.get('repoVotesTable.phase'),
      pageSize: defaultValues.get('repoVotesTable.pageSize'),
      curPage: defaultValues.get('repoVotesTable.curPage')
    },

    repoVoteResultsTable: {
      force: 1,
      interval: defaultValues.get('repoVoteResultsTable.interval'),
      phase: defaultValues.get('repoVoteResultsTable.phase'),
      pageSize: defaultValues.get('repoVoteResultsTable.pageSize'),
      curPage: defaultValues.get('repoVoteResultsTable.curPage')
    },

    cgpAllocationVotesTable: {
      force: 1,
      interval: defaultValues.get('cgpAllocationVotesTable.interval'),
      pageSize: defaultValues.get('cgpAllocationVotesTable.pageSize'),
      curPage: defaultValues.get('cgpAllocationVotesTable.curPage')
    },

    cgpPayoutVotesTable: {
      force: 1,
      interval: defaultValues.get('cgpPayoutVotesTable.interval'),
      pageSize: defaultValues.get('cgpPayoutVotesTable.pageSize'),
      curPage: defaultValues.get('cgpPayoutVotesTable.curPage')
    },

    cgpAllocationResultsTable: {
      force: 1,
      interval: defaultValues.get('cgpAllocationResultsTable.interval'),
      pageSize: defaultValues.get('cgpAllocationResultsTable.pageSize'),
      curPage: defaultValues.get('cgpAllocationResultsTable.curPage')
    },

    cgpPayoutResultsTable: {
      force: 1,
      interval: defaultValues.get('cgpPayoutResultsTable.interval'),
      pageSize: defaultValues.get('cgpPayoutResultsTable.pageSize'),
      curPage: defaultValues.get('cgpPayoutResultsTable.curPage')
    }
  });

  const fetchSyncing = action(() => {
    return Service.infos
      .findByName('syncing')
      .then(response => {
        runInAction(() => {
          state.syncing = response.success && response.data.value;
        });
      })
      .catch(() => {});
  });

  const setBlocksTableData = action(
    setTableData({ objectToSet: state.blocksTable })
  );
  const setBlockTxTableData = action(
    setTableData({
      identifiers: ['hashOrBlockNumber'],
      objectToSet: state.blockTxTable
    })
  );
  const setBlockContractsTableData = action(
    setTableData({
      identifiers: ['blockNumber'],
      objectToSet: state.blockContractsTable
    })
  );
  const setAddressTxAssetsTableData = action(
    setTableData({
      identifiers: ['address'],
      objectToSet: state.addressTxAssetsTable
    })
  );
  const setAddressTxsTableData = action(
    setTableData({
      identifiers: ['address'],
      objectToSet: state.addressTxsTable
    })
  );
  const setContractsTableData = action(
    setTableData({ objectToSet: state.contractsTable })
  );
  const setContractAssetsTableData = action(
    setTableData({
      identifiers: ['address'],
      objectToSet: state.contractAssetsTable
    })
  );
  const setContractCommandsTableData = action(
    setTableData({
      identifiers: ['address'],
      objectToSet: state.contractCommandsTable
    })
  );
  const setAssetsTableData = action(
    setTableData({ objectToSet: state.assetsTable })
  );
  const setAssetTxsTableData = action(
    setTableData({ identifiers: ['asset'], objectToSet: state.assetTxsTable })
  );
  const setAssetKeyholdersTableData = action(
    setTableData({
      identifiers: ['asset'],
      objectToSet: state.assetKeyholdersTable
    })
  );
  const setRepoVotesTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.repoVotesTable
    })
  );
  const setRepoVoteResultsTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.repoVoteResultsTable
    })
  );

  const setCGPAllocationVotesTableData = action(
    setTableData({
      identifiers: ['interval'],
      objectToSet: state.cgpAllocationVotesTable
    })
  );
  const setCGPPayoutVotesTableData = action(
    setTableData({
      identifiers: ['interval'],
      objectToSet: state.cgpPayoutVotesTable
    })
  );
  const setCGPAllocationResultsTableData = action(
    setTableData({
      identifiers: ['interval'],
      objectToSet: state.cgpAllocationResultsTable
    })
  );
  const setCGPPayoutResultsTableData = action(
    setTableData({
      identifiers: ['interval'],
      objectToSet: state.cgpPayoutResultsTable
    })
  );
  // add also setters to control both types at the same time
  const setCGPVotesTablesData = action((params = {}) => {
    setCGPAllocationVotesTableData(params);
    setCGPPayoutVotesTableData(params);
  });
  const setCGPVoteResultsTablesData = action((params = {}) => {
    setCGPAllocationResultsTableData(params);
    setCGPPayoutResultsTableData(params);
  });

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
      if (state.blocksTable.force > 1) {
        blockStore.fetchBlocks({
          page: state.blocksTable.curPage,
          pageSize: state.blocksTable.pageSize
        });
      }
    });

    autorun(function runOnBlockChange() {
      blockStore.resetBlockTransactionAssets(
        state.blockTxTable.hashOrBlockNumber
      );
    });

    autorun(function fetchBlockTransactionAssetsOnChange() {
      if (hashOrBlockNumberNotEmpty(state.blockTxTable.hashOrBlockNumber)) {
        blockStore.fetchBlockTransactionAssets(
          state.blockTxTable.hashOrBlockNumber,
          {
            page: state.blockTxTable.curPage,
            pageSize: state.blockTxTable.pageSize
          }
        );
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
          sorted: JSON.stringify(state.blockContractsTable.sorted)
        });
      }
    });

    autorun(function runOnAddressChange() {
      addressStore.resetAddressTransactionAssets(
        state.addressTxAssetsTable.address
      );
      addressStore.fetchAddress(state.addressTxAssetsTable.address);
    });

    autorun(function fetchAddressTxAssetsOnChange() {
      if (state.addressTxAssetsTable.address) {
        addressStore.fetchAddressTransactionAssets(
          state.addressTxAssetsTable.address,
          {
            page: state.addressTxAssetsTable.curPage,
            pageSize: state.addressTxAssetsTable.pageSize
          }
        );
      }
    });

    autorun(function fetchAddressTxsOnChange() {
      if (state.addressTxsTable.address) {
        addressStore.loadAddressTransactions(state.addressTxsTable.address, {
          page: state.addressTxsTable.curPage,
          pageSize: state.addressTxsTable.pageSize
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
          sorted: JSON.stringify(state.contractsTable.sorted)
        });
      }
    });

    autorun(function fetchContractAssetsOnChange() {
      if (state.contractAssetsTable.address) {
        contractStore.loadAssets(state.contractAssetsTable.address, {
          page: state.contractAssetsTable.curPage,
          pageSize: state.contractAssetsTable.pageSize
        });
      }
    });

    autorun(function fetchContractCommandsOnChange() {
      if (state.contractCommandsTable.address) {
        contractStore.loadCommands(state.contractCommandsTable.address, {
          page: state.contractCommandsTable.curPage,
          pageSize: state.contractCommandsTable.pageSize
        });
      }
    });

    autorun(function fetchAssetsOnChange() {
      if (
        state.assetsTable.curPage * state.assetsTable.pageSize <
        assetStore.assetsCount
      ) {
        assetStore.loadAssets({
          page: state.assetsTable.curPage,
          pageSize: state.assetsTable.pageSize
        });
      }
    });

    autorun(function fetchAssetTxsOnChange() {
      if (state.assetTxsTable.asset) {
        assetStore.loadAssetTxs(state.assetTxsTable.asset, {
          page: state.assetTxsTable.curPage,
          pageSize: state.assetTxsTable.pageSize
        });
      }
    });

    autorun(function fetchAssetKeyholdersOnChange() {
      if (state.assetKeyholdersTable.asset) {
        assetStore.loadAssetKeyholders(state.assetKeyholdersTable.asset, {
          page: state.assetKeyholdersTable.curPage,
          pageSize: state.assetKeyholdersTable.pageSize
        });
      }
    });

    autorun(function fetchRepoVotesOnChange() {
      if (
        state.repoVotesTable.interval !== '' &&
        state.repoVotesTable.phase !== '' &&
        state.repoVotesTable.force > 0
      ) {
        repoVoteStore.loadVotes(
          Object.assign(
            {},
            {
              page: state.repoVotesTable.curPage,
              pageSize: state.repoVotesTable.pageSize
            },
            state.repoVotesTable.interval && {
              interval: state.repoVotesTable.interval
            },
            state.repoVotesTable.phase && { phase: state.repoVotesTable.phase }
          )
        );
      }
    });

    autorun(function fetchRepoVoteResultsOnChange() {
      if (
        state.repoVoteResultsTable.interval !== '' &&
        state.repoVoteResultsTable.phase !== '' &&
        state.repoVoteResultsTable.force > 0
      ) {
        repoVoteStore.loadResults(
          Object.assign(
            {},
            {
              page: state.repoVoteResultsTable.curPage,
              pageSize: state.repoVoteResultsTable.pageSize
            },
            state.repoVoteResultsTable.interval && {
              interval: state.repoVoteResultsTable.interval
            },
            state.repoVoteResultsTable.phase && {
              phase: state.repoVoteResultsTable.phase
            }
          )
        );
      }
    });

    /**
     * A generic helper to load cgp data
     */
    function loadCGPData({ action, type, stateTable } = {}) {
      cgpStore[action](
        type,
        Object.assign(
          {},
          {
            page: stateTable.curPage,
            pageSize: stateTable.pageSize,
          },
          stateTable.interval && { interval: stateTable.interval }
        )
      );
    }

    autorun(function fetchCGPAllocationVotesOnChange() {
      if (
        state.cgpAllocationVotesTable.interval !== '' &&
        state.cgpAllocationVotesTable.force > 0
      ) {
        loadCGPData({
          action: 'loadVotes',
          stateTable: state.cgpAllocationVotesTable,
          type: 'allocation'
        });
      }
    });
    autorun(function fetchCGPPayoutVotesOnChange() {
      if (
        state.cgpPayoutVotesTable.interval !== '' &&
        state.cgpPayoutVotesTable.force > 0
      ) {
        loadCGPData({
          action: 'loadVotes',
          stateTable: state.cgpPayoutVotesTable,
          type: 'payout'
        });
      }
    });
    autorun(function fetchCGPAllocationResultsOnChange() {
      if (
        state.cgpAllocationResultsTable.interval !== '' &&
        state.cgpAllocationResultsTable.force > 0
      ) {
        loadCGPData({
          action: 'loadResults',
          stateTable: state.cgpAllocationResultsTable,
          type: 'allocation'
        });
      }
    });
    autorun(function fetchCGPPayoutResultsOnChange() {
      if (
        state.cgpPayoutResultsTable.interval !== '' &&
        state.cgpPayoutResultsTable.force > 0
      ) {
        loadCGPData({
          action: 'loadResults',
          stateTable: state.cgpPayoutResultsTable,
          type: 'payout'
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
    setBlockContractsTableData,
    setBlocksTableData,
    setContractAssetsTableData,
    setContractCommandsTableData,
    setContractsTableData,
    setRepoVotesTableData,
    setRepoVoteResultsTableData,
    setCGPAllocationResultsTableData,
    setCGPAllocationVotesTableData,
    setCGPPayoutResultsTableData,
    setCGPPayoutVotesTableData,
    setCGPVoteResultsTablesData,
    setCGPVotesTablesData,
    fetchSyncing,
    state
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
 * Creates a tableDataSetter function with custom id names
 */
function setTableData({ identifiers = [], objectToSet } = {}) {
  return (params = {}) => {
    // add to ids only if value was sent for an id
    const ids = identifiers.reduce((all, key) => {
      if(typeof params[key] !== 'undefined') {
        all.push({ key, value: params[key] })
      }
      return all;
    }, []);
    const pageSize = params.pageSize;
    const curPage = params.curPage;
    const sorted = params.sorted;
    const force = params.force; // a boolean to force an update

    ids.forEach(id => {
      if (id.value !== objectToSet[id.key]) {
        const prevId = objectToSet[id.key];
        objectToSet[id.key] = id.value;
        // When resetting the curPage when this is the first set, it can interfere other objects which try to set the page as well
        if (prevId) {
          objectToSet.curPage = 0;
        }
      }
    });
    if (pageSize) {
      objectToSet.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      objectToSet.curPage = curPage;
    }
    if (sorted) {
      objectToSet.sorted = sorted;
    }
    if (force) {
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
    id: ''
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
    }
  };
}
