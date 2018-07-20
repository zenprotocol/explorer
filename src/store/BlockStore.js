import { observable, decorate, action, computed } from 'mobx';
import Service from '../lib/Service';
import TextUtils from '../lib/TextUtils';

// TODO split to several stores - blocks, transactions
class BlockStore {
  blocks = [];
  blocksCount = 0;
  block = {};
  transaction = null;
  transactions = [];
  transactionsCount = 0;
  address = {};
  medianTime = null;
  syncing = false;
  loading = {
    blocks: false,
    block: false,
    transaction: false,
    transactions: false,
    address: false,
  };
  }

  setBlocks(blocks) {
    this.blocks = blocks;
  }

  fetchBlocks({ pageSize = 10, page = 0, sorted = [], filtered = [] } = {}) {
    this.loading.blocks = true;

    Service.blocks.find({ pageSize, page, sorted: JSON.stringify(sorted), filtered }).then(response => {
      this.setBlocks(response.data.items);
      this.blocksCount = response.data.total;
      this.loading.blocks = false;
    });
  }

  fetchBlock(id) {
    this.loading.block = true;

    Service.blocks.findById(id).then(response => {
      this.block = response.data;
      this.loading.block = false;
    }); // error handling?
  }

  fetchTransaction(hash) {
    this.loading.transaction = true;

    Service.transactions.findByHash(hash).then(response => {
      this.transaction = response.data;
      this.loading.transaction = false;
    });
  }

  fetchTransactions(params = {}) {
    this.loading.transactions = true;
    return Service.transactions.find(params).then(response => {
      this.transactions = response.data.items;
      this.transactionsCount = response.data.total;
      this.loading.transactions = false;
    });
  }

  fetchAddress(address) {
    this.loading.address = true;

    Service.addresses.findByAddress(address).then(response => {
      this.address = response.data;
      this.loading.address = false;
    });
  }

  fetchMedianTime() {
    Service.infos.findByName('medianTime').then(response => {
      if (response.success) {
        this.medianTime = new Date(Number(response.data.value));
      }
    });
  }

  fetchSyncing() {
    Service.infos.findByName('syncing').then(response => {
      this.syncing = response.success && response.data.value === 'true';
    });
  }

  get medianTimeString() {
    if (this.medianTime) {
      return TextUtils.getDateString(this.medianTime);
    }
    return null;
  }

  get numberOfTransactions() {
    // consider?
    // return this.block.Transactions && this.block.Transactions.length
    if(this.block.Transactions) {
      return this.block.Transactions.length;
    }
  }

  confirmations(blockNumber) {
    // explanation why this is required?
    if(isNaN(blockNumber)) {
      return 0;
    }
    // do we need to cast blockNumber to Number? isn't this covered in the above check?
    return Number(this.blocksCount) - Number(blockNumber) + 1;
  }
}
// why this syntax?
decorate(BlockStore, {
  blocks: observable,
  blocksCount: observable,
  block: observable, // are these the current ones? how about currentBlock?
  transaction: observable, // are these the current ones? how about currentTransaction?
  transactions: observable,
  transactionsCount: observable,
  address: observable,
  loading: observable,
  medianTime: observable,
  syncing: observable,
  setBlocks: action,
  medianTimeString: computed,
  numberOfTransactions: computed,
});

export default new BlockStore();
