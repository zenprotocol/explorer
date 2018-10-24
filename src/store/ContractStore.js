import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

class ContractStore {
  constructor() {
    this.contract = {};
    this.assets = [];
    this.assetsCount = 0;
    this.loading = {
      contract: false,
      assets: false,
    };
  }

  loadContract(address) {
    this.loading.contract = true;

    return Service.contracts
      .findByAddress(address)
      .then(response => {
        const contract = new Contract(response.data);
        runInAction(() => {
          this.contract = contract;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.contract = {};
        });
      }).then(() => {
        runInAction(() => {
          this.loading.contract = false;
        });
        return this.contract;
      });
  }

  loadAssets(address, params = {}) {
    this.loading.assets = true;

    return Service.contracts
      .findAssetsOutstanding(address, params)
      .then(({data}) => {
        runInAction(() => {
          this.assets = data.items;
          this.assetsCount = data.count;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.assets = [];
          this.assetsCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.assets = false;
        });
      });
  }
}

decorate(ContractStore, {
  contract: observable,
  assets: observable,
  assetsCount: observable,
  loading: observable,
  loadContract: action,
  loadAssets: action,
});

export default new ContractStore();

export class Contract {
  constructor({id = '', address = '', code = '', expiryBlock = null} = {}) {
    this.id = id;
    this.address = address;
    this.code = code;
    this.expiryBlock = expiryBlock;
  }
}
