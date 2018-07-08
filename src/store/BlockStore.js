import { observable, decorate, action, computed } from 'mobx';
import Service from '../lib/Service';
import TextUtils from '../lib/TextUtils';

class BlockStore {
  constructor() {
    this.blocks = [];
    this.block = {};
    this.transaction = null;
    this.totalBlocks = 0;
    this.medianTime = null;
    this.loading = false;
  }

  setBlocks(blocks) {
    this.blocks = blocks;
  }

  fetchBlocks({ pageSize = 10, page = 0, sorted = [], filtered = [] } = {}) {
    this.loading = true;
    
    Service.blocks.find({ pageSize, page, sorted: JSON.stringify(sorted), filtered }).then(response => {
      this.setBlocks(response.data.items);
      this.totalBlocks = response.data.total;
      this.loading = false;
    });
  }

  fetchBlock(id) {
    this.loading = true;

    Service.blocks.findById(id).then(response => {
      this.block = response.data;
      this.loading = false;
    });
  }

  fetchTransaction(hash) {
    this.loading = true;

    Service.transactions.findByHash(hash).then(response => {
      this.transaction = response.data;
      this.loading = false;
    });
  }

  fetchMedianTime() {
    this.loading = true;
    Service.blocks.find({ pageSize: 1 }).then(response => {
      if (response.success && response.data.items.length) {
        this.medianTime = new Date(Number(response.data.items[0].timestamp));
        this.loading = false;
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
    
    return Number(this.totalBlocks) - Number(blockNumber) + 1;
  }
}

decorate(BlockStore, {
  blocks: observable,
  block: observable,
  transaction: observable,
  loading: observable,
  medianTime: observable,
  setBlocks: action,
  totalBlocks: observable,
  medianTimeString: computed,
  numberOfTransactions: computed,
});

export default new BlockStore();
