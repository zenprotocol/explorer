import { observable, decorate, action} from 'mobx';

class UIStore {
  blocksTablePageSize = 10;
  blocksTableCurPage = 0;

  setBlocksTablePageSize(size) {
    this.blocksTablePageSize = size;
  }
  setBlocksTableCurPage(page) {
    this.blocksTableCurPage = page;
  }
}

// why this syntax?
decorate(UIStore, {
  blocksTablePageSize: observable,
  setBlocksTablePageSize: action,
  setBlocksTableCurPage: action,
});

export default new UIStore();
