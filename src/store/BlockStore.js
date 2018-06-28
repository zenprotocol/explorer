import {observable, decorate, action} from 'mobx';

class BlockStore {
  constructor() {
    this.blocks = [];
  }

  setBlocks(blocks) {
    this.blocks = blocks;
  }
}

decorate(BlockStore, {
  blocks: observable,
  setBlocks: action,
});

export default new BlockStore();