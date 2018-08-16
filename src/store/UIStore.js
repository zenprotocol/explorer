import { observable, decorate, action, autorun } from 'mobx';
import blockStore from './BlockStore';

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
    if (address) {
      this.addressTxTable.address = address;
    }
    if (pageSize) {
      this.addressTxTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.addressTxTable.prevPage = this.addressTxTable.curPage;
      this.addressTxTable.curPage = curPage;
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
});

export default new UIStore();
