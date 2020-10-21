import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/ApiService';

export default class AddressStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.address = initialState.address || {};
    this.addressTxs = initialState.addressTxs || [];
    this.addressTxsCount = initialState.addressTxsCount || 0;
    this.loading = {
      address: false,
      addressTxs: false,
    };
  }

  fetchAddress(address) {
    if (address) {
      this.loading.address = true;

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

  fetchAddressTxs(address, params = {}) {
    this.loading.addressTxs = true;
    return Service.txs
      .find(Object.assign({ address }, params))
      .then(response => {
        runInAction(() => {
          this.addressTxs = response.data.items;
          this.addressTxsCount = Number(response.data.count);
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.addressTxs = false;
        });
      });
  }



  resetAddressTxs() {
    this.addressTxs = [];
    this.addressTxsCount = 0;
  }
}

decorate(AddressStore, {
  address: observable,
  addressTxs: observable,
  addressTxsCount: observable,
  loading: observable,
  fetchAddress: action,
  fetchAddressTxs: action,
  resetAddressTxs: action,
});
