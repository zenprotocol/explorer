import { observable, decorate, action, autorun, toJS } from 'mobx';
import blockStore from './BlockStore';
import localStore from '../lib/localStore';

class UIStore {
  constructor() {
    this.blocksTable = {
      pageSize: 10,
      curPage: 0,
    };

    this.addressTxAssetsTable = {
      address: '',
      pageSize: 10,
      curPage: 0,
    };

    this.addressTxsTable = {
      address: '',
      pageSize: 10,
      curPage: 0,
    };

    this.blockTxTable = {
      hashOrBlockNumber: '0',
      pageSize: 10,
      curPage: 0,
    };

    let firstRun = true;
    autorun(() => {
      if(firstRun) {
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
      blockStore.fetchAddressTransactionAssets(this.addressTxAssetsTable.address, {
        page: this.addressTxAssetsTable.curPage,
        pageSize: this.addressTxAssetsTable.pageSize,
      });
    }
  }

  fetchAddressTxsOnChange() {
    if (this.addressTxsTable.address) {
      blockStore.loadAddressTransactions(this.addressTxsTable.address, {
        page: this.addressTxsTable.curPage,
        pageSize: this.addressTxsTable.pageSize,
      });
    }
  }

  runOnAddressChange() {
    blockStore.resetAddressTransactionAssets(this.addressTxAssetsTable.address);
    blockStore.fetchAddress(this.addressTxAssetsTable.address);
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

  saveToStorage(store) {
    localStore.set('ui-store', toJS(store));
  }

  loadFromStorage() {
    const data = localStore.get('ui-store');
    if(data) {
      if (data.blocksTable) {
        this.blocksTable.pageSize = data.blocksTable.pageSize;
      }
      if (data.addressTxAssetsTable) {
        this.addressTxAssetsTable.pageSize = data.addressTxAssetsTable.pageSize;
      }
      if (data.addressTxsTable) {
        this.addressTxsTable.pageSize = data.addressTxsTable.pageSize;
      }
      if (data.blockTxTable) {
        this.blockTxTable.pageSize = data.blockTxTable.pageSize;
      }
    }
  }
}

decorate(UIStore, {
  blocksTable: observable,
  addressTxAssetsTable: observable,
  addressTxsTable: observable,
  blockTxTable: observable,
  setBlocksTableData: action,
  setBlockTxTableData: action,
  setAddressTxAssetsTableData: action,
  setAddressTxsTableData: action,
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

export default new UIStore();
