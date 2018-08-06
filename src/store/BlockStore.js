import { observable, decorate, action, runInAction, computed } from 'mobx';
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
    this.addressTransactions = [];
    this.addressTransactionsCount = 0;
    this.medianTime = null;
    this.syncing = false;
    this.loading = {
      blocks: false,
      block: false,
      transaction: false,
      transactions: false,
      address: false,
      addressTransactions: false,
    };
  }

  fetchBlocks({ pageSize = 10, page = 0, sorted = [], filtered = [] } = {}) {
    this.loading.blocks = true;

    return Service.blocks.find({ pageSize, page, sorted: JSON.stringify(sorted), filtered }).then(response => {
      runInAction(() => {
        this.blocks = response.data.items;
        this.blocksCount = response.data.total;
        this.loading.blocks = false;
      });
    });
  }

  fetchBlock(id) {
    this.loading.block = true;

    return Service.blocks.findById(id).then(response => {
      runInAction(() => {
        this.block = response.data;
        this.loading.block = false;
      });
      return response.data;
    });
  }

  fetchTransaction(hash) {
    this.loading.transaction = true;

    return Service.transactions.findByHash(hash).then(response => {
      runInAction(() => {
        this.transaction = response.data;
        this.loading.transaction = false;
      });
    });
  }

  fetchTransactions(params = {}) {
    this.loading.transactions = true;
    return Service.transactions.find(params).then(response => {
      runInAction(() => {
        this.transactions = response.data.items;
        this.transactionsCount = response.data.total;
        this.loading.transactions = false;
      });
    });
  }

  fetchAddressTransactions(params = {}) {
    this.loading.addressTransactions = true;
    return Service.transactions.find(params).then(response => {
      runInAction(() => {
        this.addressTransactions = response.data.items;
        this.addressTransactionsCount = response.data.total;
        this.loading.addressTransactions = false;
      });
    });
  }

  resetAddressTransactions() {
    this.addressTransactions = [];
    this.addressTransactionsCount = 0;
  }

  fetchAddress(address) {
    if(address) {
      this.loading.address = true;
  
      return Service.addresses.findByAddress(address).then(response => {
        runInAction(() => {
          this.address = response.data;
        });
      }).catch((error) => {
        runInAction(() => {
          if(error.response.status === 404) {
            this.address = {status: 404};
          }
        });
      }).finally(() => {
        runInAction(() => {
          this.loading.address = false;
        });
      });
    }
  }

  fetchMedianTime() {
    return Service.infos.findByName('medianTime').then(response => {
      runInAction(() => {
        if (response.success) {
          this.medianTime = new Date(Number(response.data.value));
        }
      });
    });
  }

  fetchSyncing() {
    return Service.infos.findByName('syncing').then(response => {
      runInAction(() => {
        if (response.success) {
          this.syncing = response.data.value === 'true';
        }
        else {
          this.syncing = false;
        }
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
  medianTimeString: computed,
  numberOfTransactions: computed,
  fetchBlocks: action,
  fetchBlock: action,
  fetchTransaction: action,
  fetchTransactions: action,
  fetchAddress: action,
  fetchAddressTransactions: action,
  fetchMedianTime: action,
  fetchSyncing: action,
  resetAddressTransactions: action,
});

export default new BlockStore();
