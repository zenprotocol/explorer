import { observable, decorate, action} from 'mobx';

class UIStore {
  constructor() {
    this.blocksTablePageSize = 10;
    this.blocksTableCurPage = 0;
  }

  setBlocksTablePageSize(size) {
    this.blocksTablePageSize = size;
  }
  setBlocksTableCurPage(page) {
    this.blocksTableCurPage = page;
  }
}

decorate(UIStore, {
  blocksTablePageSize: observable,
  setBlocksTablePageSize: action,
  setBlocksTableCurPage: action,
});

export default new UIStore();
