import { observable, action, autorun, toJS, runInAction } from 'mobx';
import localStore from '../lib/localStore';
import Service from '../lib/ApiService';
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
      curPage: defaultValues.get('blocksTable.curPage'),
      sorted: defaultValues.get('blocksTable.sorted'),
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

    contractExecutionsTable: {
      force: 1,
      address: defaultValues.get('contractExecutionsTable.address'),
      pageSize: defaultValues.get('contractExecutionsTable.pageSize'),
      curPage: defaultValues.get('contractExecutionsTable.curPage'),
    },

    assetsTable: {
      force: 1,
      pageSize: defaultValues.get('assetsTable.pageSize'),
      curPage: defaultValues.get('assetsTable.curPage'),
      sorted: defaultValues.get('assetsTable.sorted'),
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
      phase: defaultValues.get('repoVotesTable.phase'),
      pageSize: defaultValues.get('repoVotesTable.pageSize'),
      curPage: defaultValues.get('repoVotesTable.curPage'),
    },

    repoVoteResultsTable: {
      force: 1,
      interval: defaultValues.get('repoVoteResultsTable.interval'),
      phase: defaultValues.get('repoVoteResultsTable.phase'),
      pageSize: defaultValues.get('repoVoteResultsTable.pageSize'),
      curPage: defaultValues.get('repoVoteResultsTable.curPage'),
    },

    cgpAllocationVotesTable: {
      force: 1,
      interval: defaultValues.get('cgpAllocationVotesTable.interval'),
      phase: defaultValues.get('cgpAllocationVotesTable.phase'),
      pageSize: defaultValues.get('cgpAllocationVotesTable.pageSize'),
      curPage: defaultValues.get('cgpAllocationVotesTable.curPage'),
    },

    cgpPayoutVotesTable: {
      force: 1,
      interval: defaultValues.get('cgpPayoutVotesTable.interval'),
      phase: defaultValues.get('cgpPayoutVotesTable.phase'),
      pageSize: defaultValues.get('cgpPayoutVotesTable.pageSize'),
      curPage: defaultValues.get('cgpPayoutVotesTable.curPage'),
    },

    cgpNominationVotesTable: {
      force: 1,
      interval: defaultValues.get('cgpNominationVotesTable.interval'),
      phase: defaultValues.get('cgpNominationVotesTable.phase'),
      pageSize: defaultValues.get('cgpNominationVotesTable.pageSize'),
      curPage: defaultValues.get('cgpNominationVotesTable.curPage'),
    },

    cgpAllocationResultsTable: {
      force: 1,
      interval: defaultValues.get('cgpAllocationResultsTable.interval'),
      phase: defaultValues.get('cgpAllocationResultsTable.phase'),
      pageSize: defaultValues.get('cgpAllocationResultsTable.pageSize'),
      curPage: defaultValues.get('cgpAllocationResultsTable.curPage'),
    },

    cgpPayoutResultsTable: {
      force: 1,
      interval: defaultValues.get('cgpPayoutResultsTable.interval'),
      phase: defaultValues.get('cgpPayoutResultsTable.phase'),
      pageSize: defaultValues.get('cgpPayoutResultsTable.pageSize'),
      curPage: defaultValues.get('cgpPayoutResultsTable.curPage'),
    },

    cgpNominationResultsTable: {
      force: 1,
      interval: defaultValues.get('cgpNominationResultsTable.interval'),
      phase: defaultValues.get('cgpNominationResultsTable.phase'),
      pageSize: defaultValues.get('cgpNominationResultsTable.pageSize'),
      curPage: defaultValues.get('cgpNominationResultsTable.curPage'),
    },
  });

  const fetchSyncing = action(() => {
    return Service.infos
      .findByName('syncing')
      .then((response) => {
        runInAction(() => {
          state.syncing = response.success && response.data.value;
        });
      })
      .catch(() => {});
  });

  const setBlocksTableData = action(setTableData({ objectToSet: state.blocksTable }));
  const setBlockTxTableData = action(
    setTableData({
      identifiers: ['hashOrBlockNumber'],
      objectToSet: state.blockTxTable,
    })
  );
  const setBlockContractsTableData = action(
    setTableData({
      identifiers: ['blockNumber'],
      objectToSet: state.blockContractsTable,
    })
  );
  const setAddressTxsTableData = action(
    setTableData({
      identifiers: ['address'],
      objectToSet: state.addressTxsTable,
    })
  );
  const setContractsTableData = action(setTableData({ objectToSet: state.contractsTable }));
  const setContractAssetsTableData = action(
    setTableData({
      identifiers: ['address'],
      objectToSet: state.contractAssetsTable,
    })
  );
  const setContractExecutionsTableData = action(
    setTableData({
      identifiers: ['address'],
      objectToSet: state.contractExecutionsTable,
    })
  );
  const setAssetsTableData = action(setTableData({ objectToSet: state.assetsTable }));
  const setAssetTxsTableData = action(
    setTableData({ identifiers: ['asset'], objectToSet: state.assetTxsTable })
  );
  const setAssetKeyholdersTableData = action(
    setTableData({
      identifiers: ['asset'],
      objectToSet: state.assetKeyholdersTable,
    })
  );
  const setRepoVotesTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.repoVotesTable,
    })
  );
  const setRepoVoteResultsTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.repoVoteResultsTable,
    })
  );

  const setCGPAllocationVotesTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.cgpAllocationVotesTable,
    })
  );
  const setCGPPayoutVotesTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.cgpPayoutVotesTable,
    })
  );
  const setCGPNominationVotesTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.cgpNominationVotesTable,
    })
  );
  const setCGPAllocationResultsTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.cgpAllocationResultsTable,
    })
  );
  const setCGPPayoutResultsTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.cgpPayoutResultsTable,
    })
  );
  const setCGPNominationResultsTableData = action(
    setTableData({
      identifiers: ['interval', 'phase'],
      objectToSet: state.cgpNominationResultsTable,
    })
  );
  // add also setters to control all types at the same time
  const setCgpVotesTablesData = action((params = {}) => {
    const { type, ...rest } = params;
    if (type === 'nomination') {
      setCGPNominationVotesTableData(rest);
    } else if (type === 'payout') {
      setCGPPayoutVotesTableData(rest);
    } else {
      setCGPAllocationVotesTableData(rest);
    }
  });
  const setCGPVoteResultsTablesData = action((params = {}) => {
    const { type, ...rest } = params;
    if (type === 'nomination') {
      setCGPNominationResultsTableData(rest);
    } else if (type === 'payout') {
      setCGPPayoutResultsTableData(rest);
    } else {
      setCGPAllocationResultsTableData(rest);
    }
  });

  const saveToStorage = action((state) => {
    localStore.set('ui-store', state);
  });

  const loadFromStorage = action(() => {
    const data = localStore.get('ui-store');
    if (data) {
      Object.keys(data).forEach((key) => {
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
          pageSize: state.blocksTable.pageSize,
          sorted: JSON.stringify(state.blocksTable.sorted),
        });
      }
    });

    autorun(function runOnBlockChange() {
      blockStore.resetBlockTxs();
    });

    autorun(function fetchBlockTransactionAssetsOnChange() {
      if (hashOrBlockNumberNotEmpty(state.blockTxTable.hashOrBlockNumber)) {
        blockStore.fetchBlockTxs(state.blockTxTable.hashOrBlockNumber, {
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

    autorun(function fetchAddressTxsOnChange() {
      if (state.addressTxsTable.address && state.addressTxsTable.force > 1) {
        addressStore.fetchAddressTxs(state.addressTxsTable.address, {
          page: state.addressTxsTable.curPage,
          pageSize: state.addressTxsTable.pageSize,
        });
      }
    });

    autorun(function fetchContractsOnChange() {
      if (state.contractsTable.force > 1) {
        contractStore.loadContracts({
          page: state.contractsTable.curPage,
          pageSize: state.contractsTable.pageSize,
          sorted: JSON.stringify(state.contractsTable.sorted),
        });
      }
    });

    autorun(function fetchContractAssetsOnChange() {
      if (state.contractAssetsTable.address && state.contractAssetsTable.force > 1) {
        contractStore.loadAssets(state.contractAssetsTable.address, {
          page: state.contractAssetsTable.curPage,
          pageSize: state.contractAssetsTable.pageSize,
        });
      }
    });

    autorun(function fetchContractExecutionsOnChange() {
      if (state.contractExecutionsTable.address && state.contractExecutionsTable.force > 1) {
        contractStore.loadExecutions(state.contractExecutionsTable.address, {
          page: state.contractExecutionsTable.curPage,
          pageSize: state.contractExecutionsTable.pageSize,
        });
      }
    });

    autorun(function fetchAssetsOnChange() {
      if (state.assetsTable.force > 1) {
        assetStore.loadAssets({
          page: state.assetsTable.curPage,
          pageSize: state.assetsTable.pageSize,
          sorted: JSON.stringify(state.assetsTable.sorted),
        });
      }
    });

    autorun(function fetchAssetTxsOnChange() {
      if (state.assetTxsTable.asset && state.assetTxsTable.force > 1) {
        assetStore.loadAssetTxs(state.assetTxsTable.asset, {
          page: state.assetTxsTable.curPage,
          pageSize: state.assetTxsTable.pageSize,
        });
      }
    });

    autorun(function fetchAssetKeyholdersOnChange() {
      if (state.assetKeyholdersTable.asset && state.assetKeyholdersTable.force > 1) {
        assetStore.loadAssetKeyholders(state.assetKeyholdersTable.asset, {
          page: state.assetKeyholdersTable.curPage,
          pageSize: state.assetKeyholdersTable.pageSize,
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
              pageSize: state.repoVotesTable.pageSize,
            },
            state.repoVotesTable.interval && {
              interval: state.repoVotesTable.interval,
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
              pageSize: state.repoVoteResultsTable.pageSize,
            },
            state.repoVoteResultsTable.interval && {
              interval: state.repoVoteResultsTable.interval,
            },
            state.repoVoteResultsTable.phase && {
              phase: state.repoVoteResultsTable.phase,
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
          stateTable.interval && { interval: stateTable.interval },
          stateTable.phase && { phase: stateTable.phase }
        )
      );
    }

    autorun(function fetchCGPAllocationVotesOnChange() {
      if (
        state.cgpAllocationVotesTable.interval !== '' &&
        state.cgpAllocationVotesTable.phase !== '' &&
        state.cgpAllocationVotesTable.force > 0
      ) {
        loadCGPData({
          action: 'loadVotes',
          stateTable: state.cgpAllocationVotesTable,
          type: 'allocation',
        });
      }
    });
    autorun(function fetchCGPPayoutVotesOnChange() {
      if (
        state.cgpPayoutVotesTable.interval !== '' &&
        state.cgpPayoutVotesTable.phase !== '' &&
        state.cgpPayoutVotesTable.force > 0
      ) {
        loadCGPData({
          action: 'loadVotes',
          stateTable: state.cgpPayoutVotesTable,
          type: 'payout',
        });
      }
    });
    autorun(function fetchCGPNominationVotesOnChange() {
      if (
        state.cgpNominationVotesTable.interval !== '' &&
        state.cgpNominationVotesTable.phase !== '' &&
        state.cgpNominationVotesTable.force > 0
      ) {
        loadCGPData({
          action: 'loadVotes',
          stateTable: state.cgpNominationVotesTable,
          type: 'nomination',
        });
      }
    });
    autorun(function fetchCGPAllocationResultsOnChange() {
      if (
        state.cgpAllocationResultsTable.interval !== '' &&
        state.cgpAllocationResultsTable.phase !== '' &&
        state.cgpAllocationResultsTable.force > 0
      ) {
        loadCGPData({
          action: 'loadResults',
          stateTable: state.cgpAllocationResultsTable,
          type: 'allocation',
        });
      }
    });
    autorun(function fetchCGPPayoutResultsOnChange() {
      if (
        state.cgpPayoutResultsTable.interval !== '' &&
        state.cgpPayoutResultsTable.phase !== '' &&
        state.cgpPayoutResultsTable.force > 0
      ) {
        loadCGPData({
          action: 'loadResults',
          stateTable: state.cgpPayoutResultsTable,
          type: 'payout',
        });
      }
    });
    autorun(function fetchCGPNominationResultsOnChange() {
      if (
        state.cgpNominationResultsTable.interval !== '' &&
        state.cgpNominationResultsTable.phase !== '' &&
        state.cgpNominationResultsTable.force > 0
      ) {
        loadCGPData({
          action: 'loadResults',
          stateTable: state.cgpNominationResultsTable,
          type: 'nomination',
        });
      }
    });
  })();

  return Object.freeze({
    setAddressTxsTableData,
    setAssetKeyholdersTableData,
    setAssetTxsTableData,
    setAssetsTableData,
    setBlockTxTableData,
    setBlockContractsTableData,
    setBlocksTableData,
    setContractAssetsTableData,
    setContractExecutionsTableData,
    setContractsTableData,
    setRepoVotesTableData,
    setRepoVoteResultsTableData,
    setCGPAllocationResultsTableData,
    setCGPAllocationVotesTableData,
    setCGPPayoutResultsTableData,
    setCGPPayoutVotesTableData,
    setCGPNominationResultsTableData,
    setCGPNominationVotesTableData,
    setCGPVoteResultsTablesData,
    setCgpVotesTablesData,
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
 * Creates a tableDataSetter function with custom id names
 */
function setTableData({ identifiers = [], objectToSet } = {}) {
  return (params = {}) => {
    // add to ids only if value was sent for an id
    const ids = identifiers.reduce((all, key) => {
      if (typeof params[key] !== 'undefined') {
        all.push({ key, value: params[key] });
      }
      return all;
    }, []);
    const pageSize = params.pageSize;
    const curPage = params.curPage;
    const sorted = params.sorted;
    const force = params.force; // a boolean to force an update

    ids.forEach((id) => {
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
      const stateVal = ObjectUtils.getSafeProp(initialState, accessor);
      return stateVal || defaultVal || getDefaultByAccessor(accessor);
    },
  };
}
