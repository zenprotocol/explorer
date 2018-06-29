import { observable, decorate, action } from 'mobx';
import Service from '../lib/Service';

class BlockStore {
  constructor() {
    this.blocks = [];
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

  fetchMedianTime() {
    this.loading = true;
    Service.blocks.find({ pageSize: 1 }).then(response => {
      if (response.success && response.data.items.length) {
        this.medianTime = new Date(Number(response.data.items[0].timestamp));
        this.loading = false;
      }
    });
  }
}

decorate(BlockStore, {
  blocks: observable,
  loading: observable,
  medianTime: observable,
  setBlocks: action,
  totalBlocks: observable,
});

export default new BlockStore();
