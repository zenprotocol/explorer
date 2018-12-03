import { observable, decorate, action, autorun, toJS, runInAction } from 'mobx';
import blockStore from './BlockStore';
import addressStore from './AddressStore';
import contractStore from './ContractStore';
import assetStore from './AssetStore';
import localStore from '../lib/localStore';
import Service from '../lib/Service';
import config from '../lib/Config';

class UIStore {
  constructor() {
    this.syncing = false;

    this.blocksTable = {
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.blockTxTable = {
      hashOrBlockNumber: '0',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.addressTxAssetsTable = {
      address: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.addressTxsTable = {
      address: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.contractsTable = {
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
      sorted: [],
    };

    this.contractAssetsTable = {
      address: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.contractCommandsTable = {
      address: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.assetsTable = {
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.assetTxsTable = {
      asset: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.assetKeyholdersTable = {
      asset: '',
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    let firstRun = true;
    autorun(() => {
      if (firstRun) {
        this.loadFromStorage();
      }
      this.saveToStorage(this);
    });
    firstRun = false;

    autorun(() => {
      this.fetchBlocksOnChange();
    });

    autorun(() => {
      this.runOnBlockChange();
    });

    autorun(() => {
      this.fetchBlockTransactionAssetsOnChange();
    });

    autorun(() => {
      this.runOnAddressChange();
    });

    autorun(() => {
      this.fetchAddressTxAssetsOnChange();
    });

    autorun(() => {
      this.fetchAddressTxsOnChange();
    });

    autorun(() => {
      this.fetchContractsOnChange();
    });

    autorun(() => {
      this.fetchContractAssetsOnChange();
    });

    autorun(() => {
      this.fetchContractCommandsOnChange();
    });

    autorun(() => {
      this.fetchAssetsOnChange();
    });
    
    autorun(() => {
      this.fetchAssetTxsOnChange();
    });

    autorun(() => {
      this.fetchAssetKeyholdersOnChange();
    });
  }

  fetchSyncing() {
    return Service.infos
      .findByName('syncing')
      .then(response => {
        runInAction(() => {
          this.syncing = response.success && response.data.value === 'true';
        });
      })
      .catch(() => {});
  }

  fetchBlocksOnChange() {
    if (this.blocksTable.curPage * this.blocksTable.pageSize < blockStore.blocksCount) {
      blockStore.fetchBlocks({
        page: this.blocksTable.curPage,
        pageSize: this.blocksTable.pageSize,
      });
    }
  }

  fetchBlockTransactionAssetsOnChange() {
    if (hashOrBlockNumberNotEmpty(this.blockTxTable.hashOrBlockNumber)) {
      blockStore.fetchBlockTransactionAssets(this.blockTxTable.hashOrBlockNumber, {
        page: this.blockTxTable.curPage,
        pageSize: this.blockTxTable.pageSize,
      });
    }
  }

  fetchAddressTxAssetsOnChange() {
    if (this.addressTxAssetsTable.address) {
      addressStore.fetchAddressTransactionAssets(this.addressTxAssetsTable.address, {
        page: this.addressTxAssetsTable.curPage,
        pageSize: this.addressTxAssetsTable.pageSize,
      });
    }
  }

  fetchAddressTxsOnChange() {
    if (this.addressTxsTable.address) {
      addressStore.loadAddressTransactions(this.addressTxsTable.address, {
        page: this.addressTxsTable.curPage,
        pageSize: this.addressTxsTable.pageSize,
      });
    }
  }

  fetchContractsOnChange() {
    if (this.contractsTable.curPage * this.contractsTable.pageSize < contractStore.contractsCount) {
      contractStore.loadContracts({
        page: this.contractsTable.curPage,
        pageSize: this.contractsTable.pageSize,
        sorted: JSON.stringify(this.contractsTable.sorted),
      });
    }
  }

  fetchContractAssetsOnChange() {
    if (this.contractAssetsTable.address) {
      contractStore.loadAssets(this.contractAssetsTable.address, {
        page: this.contractAssetsTable.curPage,
        pageSize: this.contractAssetsTable.pageSize,
      });
    }
  }

  fetchContractCommandsOnChange() {
    if (this.contractCommandsTable.address) {
      contractStore.loadCommands(this.contractCommandsTable.address, {
        page: this.contractCommandsTable.curPage,
        pageSize: this.contractCommandsTable.pageSize,
      });
    }
  }

  fetchAssetsOnChange() {
    if (this.assetsTable.curPage * this.assetsTable.pageSize < assetStore.assetsCount) {
      assetStore.loadAssets({
        page: this.assetsTable.curPage,
        pageSize: this.assetsTable.pageSize,
      });
    }
  }

  fetchAssetTxsOnChange() {
    if (this.assetTxsTable.asset) {
      assetStore.loadAssetTxs(this.assetTxsTable.asset, {
        page: this.assetTxsTable.curPage,
        pageSize: this.assetTxsTable.pageSize,
      });
    }
  }

  fetchAssetKeyholdersOnChange() {
    if (this.assetKeyholdersTable.asset) {
      assetStore.loadAssetKeyholders(this.assetKeyholdersTable.asset, {
        page: this.assetKeyholdersTable.curPage,
        pageSize: this.assetKeyholdersTable.pageSize,
      });
    }
  }

  runOnAddressChange() {
    addressStore.resetAddressTransactionAssets(this.addressTxAssetsTable.address);
    addressStore.fetchAddress(this.addressTxAssetsTable.address);
  }

  runOnBlockChange() {
    blockStore.resetBlockTransactionAssets(this.blockTxTable.hashOrBlockNumber);
  }

  setBlocksTableData({ pageSize, curPage } = {}) {
    if (pageSize) {
      this.blocksTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.blocksTable.curPage = curPage;
    }
  }

  setBlockTxTableData({ hashOrBlockNumber, pageSize, curPage } = {}) {
    if (typeof hashOrBlockNumber !== 'undefined') {
      this.blockTxTable.hashOrBlockNumber = hashOrBlockNumber;
    }
    if (pageSize) {
      this.blockTxTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.blockTxTable.curPage = curPage;
    }
  }

  setAddressTxAssetsTableData({ address, pageSize, curPage } = {}) {
    if (address && address !== this.addressTxAssetsTable.address) {
      this.addressTxAssetsTable.address = address;
      this.addressTxAssetsTable.curPage = 0;
    }
    if (pageSize) {
      this.addressTxAssetsTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.addressTxAssetsTable.curPage = curPage;
    }
  }

  setAddressTxsTableData({ address, pageSize, curPage } = {}) {
    if (address && address !== this.addressTxsTable.address) {
      this.addressTxsTable.address = address;
      this.addressTxsTable.curPage = 0;
    }
    if (pageSize) {
      this.addressTxsTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.addressTxsTable.curPage = curPage;
    }
  }

  setContractsTableData({ pageSize, curPage, sorted } = {}) {
    if (pageSize) {
      this.contractsTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.contractsTable.curPage = curPage;
    }
    if (sorted) {
      this.contractsTable.sorted = sorted;
    }
  }

  setContractAssetsTableData({ address, pageSize, curPage } = {}) {
    if (address && address !== this.contractAssetsTable.address) {
      this.contractAssetsTable.address = address;
      this.contractAssetsTable.curPage = 0;
    }
    if (pageSize) {
      this.contractAssetsTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.contractAssetsTable.curPage = curPage;
    }
  }

  setContractCommandsTableData({ address, pageSize, curPage } = {}) {
    if (address && address !== this.contractCommandsTable.address) {
      this.contractCommandsTable.address = address;
      this.contractCommandsTable.curPage = 0;
    }
    if (pageSize) {
      this.contractCommandsTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.contractCommandsTable.curPage = curPage;
    }
  }

  setAssetsTableData({ pageSize, curPage } = {}) {
    if (pageSize) {
      this.assetsTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.assetsTable.curPage = curPage;
    }
  }

  setAssetTxsTableData({ asset, pageSize, curPage } = {}) {
    if (asset && asset !== this.assetTxsTable.asset) {
      this.assetTxsTable.asset = asset;
      this.assetTxsTable.curPage = 0;
    }
    if (pageSize) {
      this.assetTxsTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.assetTxsTable.curPage = curPage;
    }
  }

  setAssetKeyholdersTableData({ asset, pageSize, curPage } = {}) {
    if (asset && asset !== this.assetKeyholdersTable.asset) {
      this.assetKeyholdersTable.asset = asset;
      this.assetKeyholdersTable.curPage = 0;
    }
    if (pageSize) {
      this.assetKeyholdersTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.assetKeyholdersTable.curPage = curPage;
    }
  }

  saveToStorage(store) {
    localStore.set('ui-store', toJS(store));
  }

  loadFromStorage() {
    const data = localStore.get('ui-store');
    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key].pageSize && this[key]) {
          this[key].pageSize = data[key].pageSize;
        }
      });
    }
  }
}

decorate(UIStore, {
  syncing: observable,
  blocksTable: observable,
  addressTxAssetsTable: observable,
  addressTxsTable: observable,
  blockTxTable: observable,
  contractsTable: observable,
  contractAssetsTable: observable,
  contractCommandsTable: observable,
  assetsTable: observable,
  assetTxsTable: observable,
  assetKeyholdersTable: observable,
  fetchSyncing: action,
  setBlocksTableData: action,
  setBlockTxTableData: action,
  setAddressTxAssetsTableData: action,
  setAddressTxsTableData: action,
  setContractsTableData: action,
  setContractAssetsTableData: action,
  setContractCommandsTableData: action,
  setAssetsTableData: action,
  setAssetTxsTableData: action,
  setAssetKeyholdersTableData: action,
  loadFromStorage: action,
});

function hashOrBlockNumberNotEmpty(hashOrBlockNumber) {
  return (
    typeof hashOrBlockNumber !== 'undefined' &&
    hashOrBlockNumber !== '' &&
    hashOrBlockNumber !== '0' &&
    hashOrBlockNumber !== 0
  );
}

// todo - use this for all common table setters
// function setTableData({nameOfIdentifier, objectToSet} = {}) {
//   return (params = {}) => {
//     const id = params[nameOfIdentifier];
//     const pageSize = params.pageSize;
//     const curPage = params.curPage;

//     if (id && id !== objectToSet[nameOfIdentifier]) {
//       objectToSet[nameOfIdentifier] = id;
//       objectToSet.curPage = 0;
//     }
//     if (pageSize) {
//       objectToSet.pageSize = pageSize;
//     }
//     if (curPage !== undefined) {
//       objectToSet.curPage = curPage;
//     }
//   };
// }

export default new UIStore();
