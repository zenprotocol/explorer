import { observable, decorate, action, autorun, toJS } from 'mobx';
import blockStore from './BlockStore';
import localStore from '../lib/localStore';

function hashOrBlockNumberNotEmpty(hashOrBlockNumber) {
  return (
    typeof hashOrBlockNumber !== 'undefined' &&
    hashOrBlockNumber !== '' &&
    hashOrBlockNumber !== '0' &&
    hashOrBlockNumber !== 0
  );
}

class UIStore {
  constructor() {
    this.blocksTable = {
      pageSize: 10,
      curPage: 0,
      prevPage: -1,
    };

    this.addressTxTable = {
      address: '',
      pageSize: 10,
      curPage: 0,
      prevPage: -1,
    };

    this.blockTxTable = {
      hashOrBlockNumber: '0',
      pageSize: 10,
      curPage: 0,
      prevPage: -1,
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
      this.fetchAddressTransactionsOnChange();
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

  fetchAddressTransactionsOnChange() {
    if (this.addressTxTable.address) {
      blockStore.fetchAddressTransactionAssets(this.addressTxTable.address, {
        page: this.addressTxTable.curPage,
        pageSize: this.addressTxTable.pageSize,
      });
    }
  }

  runOnAddressChange() {
    blockStore.resetAddressTransactionAssets(this.addressTxTable.address);
    blockStore.fetchAddress(this.addressTxTable.address);
  }

  runOnBlockChange() {
    blockStore.resetBlockTransactionAssets(this.blockTxTable.hashOrBlockNumber);
  }

  setBlocksTableData({ pageSize, curPage } = {}) {
    if (pageSize) {
      this.blocksTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.blocksTable.prevPage = this.blocksTable.curPage;
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
      this.blockTxTable.prevPage = this.blockTxTable.curPage;
      this.blockTxTable.curPage = curPage;
    }
  }

  setAddressTxTableData({ address, pageSize, curPage } = {}) {
    if (address && address !== this.addressTxTable.address) {
      this.addressTxTable.address = address;
      this.addressTxTable.curPage = 0;
    }
    if (pageSize) {
      this.addressTxTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.addressTxTable.prevPage = this.addressTxTable.curPage;
      this.addressTxTable.curPage = curPage;
    }
  }

  saveToStorage(store) {
    localStore.set('ui-store', toJS(store));
  }

  loadFromStorage() {
    const data = localStore.get('ui-store');
    if(data) {
      if (data.blocksTable) {
        this.blocksTable = data.blocksTable;
      }
      if (data.addressTxTable) {
        this.addressTxTable = data.addressTxTable;
      }
      if (data.blockTxTable) {
        this.blockTxTable = data.blockTxTable;
      }
    }
  }
}

decorate(UIStore, {
  blocksTable: observable,
  addressTxTable: observable,
  blockTxTable: observable,
  setBlocksTableData: action,
  setBlockTxTableData: action,
  setAddressTxTableData: action,
  loadFromStorage: action,
});

export default new UIStore();
