import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

class ContractStore {
  constructor() {
    this.contract = {};
    this.assets = [];
    this.commands = [];
    this.commandsCount = 0;
    this.loading = {
      contract: false,
      assets: false,
      commands: false,
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
      .catch((error) => {
        runInAction(() => {
          this.contract = {};
          if (error.status === 404) {
            this.contract.status = 404;
          }
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

  loadCommands(address, params = {}) {
    this.loading.commands = true;

    return Service.contracts
      .findCommands(address, params)
      .then(({data}) => {
        runInAction(() => {
          this.commands = data.items;
          this.commandsCount = data.count;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.commands = [];
          this.commandsCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.commands = false;
        });
      });
  }
}

decorate(ContractStore, {
  contract: observable,
  assets: observable,
  assetsCount: observable,
  commands: observable,
  commandsCount: observable,
  loading: observable,
  loadContract: action,
  loadAssets: action,
  loadCommands: action,
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
