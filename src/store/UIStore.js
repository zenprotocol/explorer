import { observable, decorate, action, autorun } from 'mobx';
import blockStore from './BlockStore';

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

    autorun(() => {
      this.fetchBlocksOnChange();
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
      blockStore.fetchBlocks({ page: this.blocksTable.curPage, pageSize: this.blocksTable.pageSize });
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

  setBlocksTableData({ pageSize, curPage } = {}) {
    if (pageSize) {
      this.blocksTable.pageSize = pageSize;
    }
    if (curPage !== undefined) {
      this.blocksTable.prevPage = this.blocksTable.curPage;
      this.blocksTable.curPage = curPage;
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
  setBlocksTableData: action,
  setAddressTxTableData: action,
});

export default new UIStore();
