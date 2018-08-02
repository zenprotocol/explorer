import { observable, decorate, action, autorun } from 'mobx';
import blockStore from './BlockStore';

class UIStore {
  constructor() {
    this.blocksTable = {
      pageSize: 10,
      curPage: 0,
      prevPage: -1,
    };

    autorun(() => {
      if(this.blocksTable.curPage * this.blocksTable.pageSize < blockStore.blocksCount) {
        blockStore.fetchBlocks({page: this.blocksTable.curPage, pageSize: this.blocksTable.pageSize});
      }
    });
  }

  setBlocksTableData({pageSize, curPage} = {}) {
    if(pageSize) {
      this.blocksTable.pageSize = pageSize;
    }
    if(curPage !== undefined) {
      this.blocksTable.prevPage = this.blocksTable.curPage;
      this.blocksTable.curPage = curPage;
    }
  }
}

decorate(UIStore, {
  blocksTable: observable,
  setBlocksTableData: action,
});

export default new UIStore();
