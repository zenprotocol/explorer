import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

export default class AddressStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.address = initialState.address || {};
    this.addressTransactions = initialState.addressTransactions || [];
    this.addressTransactionsCount = initialState.addressTransactionsCount || 0;
    this.addressTransactionAssets = initialState.addressTransactionAssets || [];
    this.addressTransactionAssetsCount = initialState.addressTransactionAssetsCount || 0;
    this.loading = {
      address: false,
      addressTransactions: false,
      addressTransactionAssets: false,
    };
  }

  fetchAddress(address) {
    if (address && this.address.address !== address) {
      this.loading.address = true;

      runInAction(() => {
        this.address = {};
      });
      return Service.addresses
        .findByAddress(address)
        .then(response => {
          runInAction(() => {
            this.address = response.data;
          });
        })
        .catch(error => {
          runInAction(() => {
            this.address = {};
            if (error.status === 404) {
              this.address.status = 404;
            }
          });
        })
        .then(() => {
          runInAction(() => {
            this.loading.address = false;
          });
        });
    }
  }

  fetchAddressTransactionAssets(address, params = {}) {
    this.loading.addressTransactionAssets = true;
    return Service.addresses
      .findTransactionsAssets(address, params)
      .then(response => {
        runInAction(() => {
          this.addressTransactionAssets = response.data.items;
          this.addressTransactionAssetsCount = Number(response.data.total);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.addressTransactionAssets = false;
        });
      });
  }

  resetAddressTransactionAssets() {
    this.addressTransactionAssets = [];
    this.addressTransactionAssetsCount = 0;
  }

  loadAddressTransactions(address, params = {}) {
    this.loading.addressTransactions = true;
    return Service.transactions
      .find(Object.assign({ address }, params))
      .then(response => {
        runInAction(() => {
          this.addressTransactions = response.data.items;
          this.addressTransactionsCount = Number(response.data.count);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.addressTransactions = false;
        });
      });
  }
}

decorate(AddressStore, {
  address: observable,
  addressTransactionAssets: observable,
  addressTransactionAssetsCount: observable,
  addressTransactions: observable,
  addressTransactionsCount: observable,
  loading: observable,
  fetchAddress: action,
  fetchAddressTransactionAssets: action,
  loadAddressTransactions: action,
  resetAddressTransactionAssets: action,
});
