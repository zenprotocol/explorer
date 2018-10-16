import { observable, decorate, action, runInAction, computed } from 'mobx';
import service from '../lib/Service';

class RootStore {
  constructor() {
    this.chain = 'main';
    this.loading = {
      chain: false,
    };
  }

  get isTestnet() {
    return this.chain === 'test';
  }

  loadChain() {
    this.loading.chain = true;
    return service.infos.find().then(response => {
      runInAction(() => {
        this.loading.chain = false;
        const chain = response.data.chain || 'main';
        this.chain = chain.endsWith('net') ? chain.substring(0, chain.length - 3) : chain;
      });
    });
  }
}

decorate(RootStore, {
  chain: observable,
  loading: observable,
  loadChain: action,
  isTestnet: computed,
});

export default new RootStore();
