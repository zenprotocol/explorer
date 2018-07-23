import { observable, decorate, action, computed } from 'mobx';
import Service from '../lib/Service';
import TextUtils from '../lib/TextUtils';

// TODO split to several stores - blocks, transactions
class BlockStore {
  constructor() {
    this.blocks = [];
    this.blocksCount = 0;
    this.block = {};
    this.transaction = null;
    this.transactions = [];
    this.transactionsCount = 0;
    this.address = {};
    this.medianTime = null;
    this.syncing = false;
    this.loading = {
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
    });
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
    return Service.infos.findByName('syncing').then(response => {
      if (response.success) {
        this.syncing = response.data.value === 'true';
      }
      else {
        this.syncing = false;
      }
    });
  }

  get medianTimeString() {
    if (this.medianTime) {
      return TextUtils.getDateString(this.medianTime);
    }
    return null;
  }

  get numberOfTransactions() {
    if(this.block.Transactions) {
      return this.block.Transactions.length;
    }
  }

  confirmations(blockNumber) {
    if(isNaN(blockNumber)) {
      return 0;
    }
    
    return Number(this.blocksCount) - Number(blockNumber) + 1;
  }
}

decorate(BlockStore, {
  blocks: observable,
  blocksCount: observable,
  block: observable,
  transaction: observable,
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
