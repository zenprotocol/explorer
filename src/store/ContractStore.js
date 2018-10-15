import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

class ContractStore {
  constructor() {
    this.contract = {};
    this.loading = {
      contract: false,
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
        return contract;
      })
      .catch(() => {
        // avoid using finally
      }).then(() => {
        runInAction(() => {
          this.loading.contract = false;
        });
      });
  }
}

decorate(ContractStore, {
  contract: observable,
  loadContract: action,
  loading: observable,
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
