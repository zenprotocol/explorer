import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

export default class ContractStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.contracts = initialState.contracts || [];
    this.contractsCount = initialState.contractsCount || 0;
    this.contract = initialState.contract || {};
    this.assets = initialState.assets || [];
    this.assetsCount = initialState.assetsCount || 0;
    this.executions = initialState.executions || [];
    this.executionsCount = initialState.executionsCount || 0;
    this.loading = {
      contracts: false,
      contract: false,
      assets: false,
      executions: false,
    };
  }

  loadContracts(params = { pageSize: 10, page: 0 }, { setCount = true, setItems = true } = {}) {
    this.loading.contracts = true;

    return Service.contracts
      .find(params)
      .then((response) => {
        runInAction(() => {
          if (setItems) {
            this.contracts = response.data.items;
          }
          if (setCount) {
            this.contractsCount = response.data.count;
          }
        });
      })
      .catch(() => {
        if (setItems) {
          this.contracts = [];
        }
        if (setCount) {
          this.contractsCount = 0;
        }
      })
      .then(() => {
        runInAction(() => {
          this.loading.contracts = false;
        });
      });
  }

  loadContract(address) {
    if (!address) {
      return Promise.resolve(this.contract);
    }

    this.loading.contract = true;

    return Service.contracts
      .findByAddress(address)
      .then((response) => {
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
      })
      .then(() => {
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
      .then(({ data }) => {
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

  loadExecutions(address, params = {}) {
    this.loading.executions = true;

    return Service.contracts
      .findExecutions(address, params)
      .then(({ data }) => {
        runInAction(() => {
          this.executions = data.items;
          this.executionsCount = data.count;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.executions = [];
          this.executionsCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.executions = false;
        });
      });
  }
}

decorate(ContractStore, {
  contracts: observable,
  contractsCount: observable,
  contract: observable,
  assets: observable,
  assetsCount: observable,
  executions: observable,
  executionsCount: observable,
  loading: observable,
  loadContracts: action,
  loadContract: action,
  loadAssets: action,
  loadExecutions: action,
});

export class Contract {
  constructor({
    id = '',
    address = '',
    code = '',
    expiryBlock = null,
    lastActivationTransaction = null,
  } = {}) {
    this.id = id;
    this.address = address;
    this.code = code;
    this.expiryBlock = expiryBlock;
    this.lastActivationTransaction = lastActivationTransaction;
  }
}
