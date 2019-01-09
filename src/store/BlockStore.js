import { observable, decorate, action, runInAction, computed, autorun } from 'mobx';
import Service from '../lib/Service';
import TextUtils from '../lib/TextUtils';

export default class BlockStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.blocks = initialState.blocks || [];
    this.blocksCount = initialState.blocksCount || 0;
    this.hashOrBlockNumber = initialState.hashOrBlockNumber || 0;
    this.latestBlock = initialState.latestBlock || {};
    this.block = initialState.block || {};
    this.blockTransactionAssets = initialState.blockTransactionAssets || [];
    this.blockTransactionAssetsCount = initialState.blockTransactionAssetsCount || 0;
    this.blockContracts = initialState.blockContracts || [];
    this.blockContractsCount = initialState.blockContractsCount || 0;
    this.medianTime = initialState.medianTime || null;

    this.loading = {
      blocks: false,
      latestBlock: false,
      block: false,
      blockTransactionAssets: false,
      blockContracts: false,
    };

    // Automatic loading
    autorun(() => {
      this.fetchLatestBlockOnBlocksCountChange();
    });
  }

  setBlocksCount(count) {
    this.blocksCount = count;
  }

  fetchBlocks(params = { pageSize: 10, page: 0 }) {
    this.loading.blocks = true;

    return Service.blocks
      .find(params)
      .then(response => {
        runInAction(() => {
          this.blocks = response.data.items;
          this.blocksCount = response.data.count;
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.blocks = false;
        });
      });
  }

  fetchLatestBlockOnBlocksCountChange() {
    if (this.blocksCount) {
      this.fetchLatestBlock();
    }
  }

  fetchLatestBlock() {
    this.loading.latestBlock = true;

    return Service.blocks
      .findById(this.blocksCount)
      .then(response => {
        runInAction(() => {
          this.latestBlock = response.data;
        });
      })
      .catch(error => {
        runInAction(() => {
          this.latestBlock = {};
          if (error.status === 404) {
            this.latestBlock.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.latestBlock = false;
        });
        return this.latestBlock;
      });
  }

  fetchBlock(id) {
    if(id === this.hashOrBlockNumber) {
      return Promise.resolve(this.block);
    }
    this.hashOrBlockNumber = id;
    this.loading.block = true;

    return Service.blocks
      .findById(id)
      .then(response => {
        runInAction(() => {
          this.block = response.data;
        });
      })
      .catch(error => {
        runInAction(() => {
          this.block = {};
          if (error.status === 404) {
            this.block.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.block = false;
        });
        return this.block;
      });
  }

  fetchBlockTransactionAssets(blockNumber, params = {}) {
    this.loading.blockTransactionAssets = true;
    return Service.blocks
      .findTransactionsAssets(blockNumber, params)
      .then(response => {
        runInAction(() => {
          this.blockTransactionAssets = response.data.items;
          this.blockTransactionAssetsCount = Number(response.data.total);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.blockTransactionAssets = false;
        });
      });
  }

  fetchBlockContracts(blockNumber, params = {}) {
    this.loading.blockContracts = true;
    return Service.contracts
      .find({blockNumber, ...params})
      .then(response => {
        runInAction(() => {
          this.blockContracts = response.data.items;
          this.blockContractsCount = Number(response.data.count);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.blockContracts = false;
        });
      });
  }

  resetBlockTransactionAssets() {
    this.blockTransactionAssets = [];
    this.blockTransactionAssetsCount = 0;
  }

  fetchMedianTime() {
    return Service.infos.findByName('medianTime').then(response => {
      runInAction(() => {
        if (response.success) {
          this.medianTime = new Date(Number(response.data.value));
        }
      }).catch(() => {
        this.medianTime = new Date();
      });
    });
  }

  get medianTimeString() {
    if (this.medianTime) {
      return TextUtils.getDateString(this.medianTime);
    }
    return null;
  }

  get numberOfTransactions() {
    return this.block.Transactions ? this.block.Transactions.length : 0;
  }

  confirmations(blockNumber) {
    if (!blockNumber) {
      return 0;
    }

    return Math.max(0, Number(this.blocksCount) - Number(blockNumber) + 1);
  }
}

decorate(BlockStore, {
  blocks: observable,
  blocksCount: observable,
  hashOrBlockNumber: observable,
  latestBlock: observable,
  block: observable,
  blockTransactionAssets: observable,
  blockTransactionAssetsCount: observable,
  blockContracts: observable,
  blockContractsCount: observable,
  loading: observable,
  medianTime: observable,
  medianTimeString: computed,
  numberOfTransactions: computed,
  setBlocksCount: action,
  fetchBlocks: action,
  fetchBlock: action,
  fetchBlockTransactionAssets: action,
  fetchMedianTime: action,
  resetBlockTransactionAssets: action,
});
