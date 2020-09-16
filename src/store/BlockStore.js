import { observable, decorate, action, runInAction, computed, autorun } from 'mobx';
import Service from '../lib/ApiService';
import TextUtils from '../lib/TextUtils';

export default class BlockStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.blocks = initialState.blocks || [];
    this.blocksCount = initialState.blocksCount || 0;
    this.hashOrBlockNumber = initialState.hashOrBlockNumber || 0;
    this.latestBlock = initialState.latestBlock || {};
    this.block = initialState.block || {};
    this.blockTxs = initialState.blockTxs || [];
    this.blockTxsCount = initialState.blockTxsCount || 0;
    this.blockContracts = initialState.blockContracts || [];
    this.blockContractsCount = initialState.blockContractsCount || 0;
    this.medianTime = initialState.medianTime || null;

    this.loading = {
      blocks: false,
      latestBlock: false,
      block: false,
      blockTxs: false,
      blockContracts: false,
    };

    // Automatic loading
    autorun(() => {
      this.fetchLatestBlockOnBlocksCountChange();
    });
  }

  fetchBlocksCount() {
    return Service.blocks
      .count()
      .then(response => {
        runInAction(() => {
          this.blocksCount = Number(response.data);
        });
      })
      .catch(() => {});
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
      .findOne(this.blocksCount)
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

  fetchBlock(hashOrBlockNumber) {
    if(hashOrBlockNumber === this.hashOrBlockNumber) {
      return Promise.resolve(this.block);
    }
    this.hashOrBlockNumber = hashOrBlockNumber;
    this.loading.block = true;

    return Service.blocks
      .findOne(hashOrBlockNumber)
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

  fetchBlockTxs(blockNumber, params = {}) {
    this.loading.blockTxs = true;
    return Service.blocks
      .findTxs(blockNumber, params)
      .then(response => {
        runInAction(() => {
          this.blockTxs = response.data.items;
          this.blockTxsCount = Number(response.data.count);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.blockTxs = false;
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

  resetBlockTxs() {
    this.blockTxs = [];
    this.blockTxsCount = 0;
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
    return (this.block || {}).Txs ? this.block.Txs.length : 0;
  }
}

decorate(BlockStore, {
  blocks: observable,
  blocksCount: observable,
  hashOrBlockNumber: observable,
  latestBlock: observable,
  block: observable,
  blockTxs: observable,
  blockTxsCount: observable,
  blockContracts: observable,
  blockContractsCount: observable,
  loading: observable,
  medianTime: observable,
  medianTimeString: computed,
  numberOfTransactions: computed,
  fetchBlocksCount: action,
  fetchBlocks: action,
  fetchBlock: action,
  fetchBlockTxs: action,
  fetchMedianTime: action,
  resetBlockTxs: action,
});
