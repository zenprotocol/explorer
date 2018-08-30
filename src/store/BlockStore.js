import { observable, decorate, action, runInAction, computed } from 'mobx';
import Service from '../lib/Service';
import TextUtils from '../lib/TextUtils';
import SearchUtils from '../lib/SearchUtils';

// TODO split to several stores - blocks, transactions
class BlockStore {
  constructor() {
    this.blocks = [];
    this.blocksCount = 0;
    this.block = {};
    this.blockTransactionAssets = [];
    this.blockTransactionAssetsCount = 0;
    this.transaction = null;
    this.transactions = [];
    this.transactionsCount = 0;
    this.address = {};
    this.addressTransactionAssets = [];
    this.addressTransactionAssetsCount = 0;
    this.searchString = '';
    this.searchStringPrev = '';
    this.searchResults = {};
    this.medianTime = null;
    this.syncing = false;
    this.loading = {
      blocks: false,
      block: false,
      blockTransactionAssets: false,
      transaction: false,
      transactions: false,
      address: false,
      addressTransactionAssets: false,
      searchResults: false,
    };

    this.resetSearchResults();
  }

  fetchBlocks({ pageSize = 10, page = 0, sorted = [], filtered = [] } = {}) {
    this.loading.blocks = true;

    return Service.blocks
      .find({ pageSize, page, sorted: JSON.stringify(sorted), filtered })
      .then(response => {
        runInAction(() => {
          this.blocks = response.data.items;
          this.blocksCount = response.data.total;
          this.loading.blocks = false;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.loading.blocks = false;
        });
      });
  }

  fetchBlock(id) {
    this.loading.block = true;

    return Service.blocks
      .findById(id)
      .then(response => {
        runInAction(() => {
          this.block = response.data;
          this.loading.block = false;
        });
        return response.data;
      })
      .catch(() => {
        runInAction(() => {
          this.loading.block = false;
        });
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
          this.loading.blockTransactionAssets = false;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.loading.blockTransactionAssets = false;
        });
      });
  }

  resetBlockTransactionAssets() {
    this.blockTransactionAssets = [];
    this.blockTransactionAssetsCount = 0;
  }

  fetchTransaction(hash) {
    this.loading.transaction = true;

    return Service.transactions
      .findByHash(hash)
      .then(response => {
        runInAction(() => {
          this.transaction = response.data;
          this.loading.transaction = false;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.loading.transaction = false;
        });
      });
  }

  fetchTransactions(params = {}) {
    this.loading.transactions = true;
    return Service.transactions
      .find(params)
      .then(response => {
        runInAction(() => {
          this.transactions = response.data.items;
          this.transactionsCount = response.data.total;
          this.loading.transactions = false;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.loading.transactions = false;
        });
      });
  }

  fetchAddressTransactionAssets(address, params = {}) {
    this.loading.addressTransactionAssets = true;
    return Service.addresses
      .findTransactionsAssets(address, params)
      .then(response => {
        runInAction(() => {
          this.addressTransactionAssets = response.data.items;
          this.addressTransactionAssetsCount = Number(response.data.total);
          this.loading.addressTransactionAssets = false;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.loading.addressTransactionAssets = false;
        });
      });
  }

  fetchTransactionAsset(transactionAssets, index) {
    const transactionAsset =
      (transactionAssets || []).length > index ? transactionAssets[index] : null;
    if (transactionAsset) {
      return Service.transactions
        .findAsset(transactionAsset.transactionId, transactionAsset.asset)
        .then(response => {
          runInAction(() => {
            transactionAssets[index].TransactionAsset = response.data;
          });
        });
    }
    return Promise.resolve();
  }

  resetAddressTransactionAssets() {
    this.addressTransactionAssets = [];
    this.addressTransactionAssetsCount = 0;
  }

  fetchAddress(address) {
    if (address) {
      this.loading.address = true;

      return Service.addresses
        .findByAddress(address)
        .then(response => {
          runInAction(() => {
            this.address = response.data;
            this.loading.address = false;
          });
        })
        .catch(error => {
          runInAction(() => {
            this.loading.address = false;
            if (error.response.status === 404) {
              this.address = { status: 404 };
            }
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
        } else {
          this.syncing = false;
        }
      });
    });
  }

  setSearchString(search) {
    this.searchString = search;
  }

  clearSearchString() {
    this.searchString = '';
    this.searchStringPrev = '';
  }

  search(value) {
    if (!SearchUtils.validateSearchString(value) || value === this.searchStringPrev) {
      return Promise.resolve();
    }

    this.resetSearchResults();
    this.searchStringPrev = this.searchString;
    this.searchString = value;
    this.loading.searchResults = true;

    return Service.search
      .searchAll(value)
      .then(response => {
        runInAction(() => {
          this.loading.searchResults = false;
          if (response.success) {
            this.searchResults = response.data;
          }
        });
      })
      .catch(() => {
        runInAction(() => {
          this.loading.searchResults = false;
        });
      });
  }

  resetSearchResults() {
    this.searchResults = {
      total: 0,
      items: [],
    };
  }

  get searchStringValid() {
    return SearchUtils.validateSearchString(this.searchString);
  }

  get medianTimeString() {
    if (this.medianTime) {
      return TextUtils.getDateString(this.medianTime);
    }
    return null;
  }

  get numberOfTransactions() {
    if (this.block.Transactions) {
      return this.block.Transactions.length;
    }
  }

  confirmations(blockNumber) {
    if (isNaN(blockNumber)) {
      return 0;
    }

    return Number(this.blocksCount) - Number(blockNumber) + 1;
  }
}

decorate(BlockStore, {
  blocks: observable,
  blocksCount: observable,
  block: observable,
  blockTransactionAssets: observable,
  blockTransactionAssetsCount: observable,
  transaction: observable,
  transactions: observable,
  transactionsCount: observable,
  address: observable,
  addressTransactionAssets: observable,
  addressTransactionAssetsCount: observable,
  searchString: observable,
  searchStringPrev: observable,
  searchResults: observable,
  loading: observable,
  medianTime: observable,
  syncing: observable,
  medianTimeString: computed,
  numberOfTransactions: computed,
  fetchBlocks: action,
  fetchBlock: action,
  fetchBlockTransactionAssets: action,
  fetchTransaction: action,
  fetchTransactions: action,
  fetchAddress: action,
  fetchAddressTransactionAssets: action,
  fetchTransactionAsset: action,
  fetchMedianTime: action,
  fetchSyncing: action,
  resetAddressTransactionAssets: action,
  resetBlockTransactionAssets: action,
  setSearchString: action,
  clearSearchString: action,
  search: action,
  searchStringValid: computed,
  resetSearchResults: action,
});

export default new BlockStore();
