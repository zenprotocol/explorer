import { observable, decorate, action, runInAction, computed } from 'mobx';
import service from '../lib/ApiService';

export default class InfoStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.infos = initialState.infos || { chain: 'main' };
    this.loading = {
      infos: false,
    };
  }

  get isTestnet() {
    return (this.infos || {}).chain === 'test';
  }

  loadInfos() {
    this.loading.infos = true;
    return service.infos
      .find()
      .then(response => {
        runInAction(() => {
          const chain = response.data.chain || 'main';
          this.infos = Object.assign({}, response.data, {
            chain: chain.endsWith('net') ? chain.substring(0, chain.length - 3) : chain,
          });
        });
      })
      .catch(() => {
        runInAction(() => {
          this.infos = { chain: 'main' };
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.infos = false;
        });
        return this.infos;
      });
  }
}

decorate(InfoStore, {
  infos: observable,
  loading: observable,
  loadInfos: action,
  isTestnet: computed,
});
