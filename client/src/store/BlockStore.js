import {observable, decorate, action, autorun} from 'mobx';

class BlockStore {
  blocks = [];

  constructor() {
    autorun(() => {
      console.log('Blocks were changed', this.blocks);
    });
  }

  setBlocks(blocks) {
    this.blocks = blocks;
  }
}

decorate(BlockStore, {
  blocks: observable,
  setBlocks: action,
});

export default BlockStore;