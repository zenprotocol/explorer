import { observable, decorate, action, runInAction, computed } from 'mobx';
import Service from '../lib/ApiService';

export default class CGPStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.relevantInterval = initialState.relevantInterval || {};
    this.votesAllocation = initialState.votesAllocation || { items: [], count: 0 };
    this.votesPayout = initialState.votesPayout || { items: [], count: 0 };
    this.votesNomination = initialState.votesNomination || { items: [], count: 0 };
    this.resultsAllocation = initialState.resultsAllocation || { items: [], count: 0 };
    this.resultsPayout = initialState.resultsPayout || { items: [], count: 0 };
    this.resultsNomination = initialState.resultsNomination || { items: [], count: 0 };
    this.payoutBallots = initialState.payoutBallots || { items: [], count: 0 };
    this.loading = {
      relevantInterval: false,
      votes: false,
      results: false,
      payoutBallots: false,
    };
  }

  get intervalLength() {
    return this.rootStore.infoStore.infos.chain === 'main' ? 10000 : 100;
  }

  get currentInterval() {
    return this.serverIntervalToUi(
      Math.ceil(this.rootStore.blockStore.blocksCount / this.intervalLength)
    );
  }

  get snapshotBlock() {
    return (
      (this.uiIntervalToServer(this.currentInterval) - 1) * this.intervalLength +
      this.intervalLength * 0.9
    );
  }

  get tallyBlock() {
    return this.uiIntervalToServer(this.currentInterval) * this.intervalLength;
  }

  /**
   * Convert a real interval number to the UI one
   * On mainnet the 1st interval was actually interval 25, display it as 1
   * @param {(number|string)} interval
   */
  serverIntervalToUi(interval) {
    return this.rootStore.infoStore.infos.chain === 'main' ? Number(interval) - 24 : Number(interval) - 1413;
  }
  /**
   * Convert a UI interval number to the real one
   * On mainnet the 1st interval was actually interval 25, display it as 1
   * @param {(number|string)} display
   */
  uiIntervalToServer(display) {
    if (Number(display) === 0) return 0;
    return this.rootStore.infoStore.infos.chain === 'main' ? Number(display) + 24 : Number(display) + 1413;
  }

  loadRelevantInterval(params = {}) {
    this.loading.relevantInterval = true;

    return Service.cgp
      .findCurrent(Object.assign({}, params, { interval: this.uiIntervalToServer(params.interval) }))
      .then(({ data }) => {
        runInAction(() => {
          this.relevantInterval = Object.assign(data, {
            interval: this.serverIntervalToUi(data.interval),
          });
        });
      })
      .catch((error) => {
        runInAction(() => {
          this.relevantInterval = {};
          if (error.status === 404) {
            this.relevantInterval.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.relevantInterval = false;
        });
      });
  }

  loadVotes(type, params = {}) {
    if (!validateType(type)) return;
    this.loading.votes = true;

    return Service.cgp
      .findAllVotes(type, Object.assign({}, params, { interval: this.uiIntervalToServer(params.interval) }))
      .then(({ data }) => {
        runInAction(() => {
          if (type === 'nomination') {
            this.votesNomination = data;
          } else if (type === 'payout') {
            this.votesPayout = data;
          } else {
            this.votesAllocation = data;
          }
        });
      })
      .catch(() => {
        runInAction(() => {
          if (type === 'nomination') {
            this.votesNomination = { items: [], count: 0 };
          } else if (type === 'payout') {
            this.votesPayout = { items: [], count: 0 };
          } else {
            this.votesAllocation = { items: [], count: 0 };
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.votes = false;
        });
      });
  }

  loadResults(type, params = {}) {
    if (!validateType(type)) return;
    this.loading.results = true;

    return Service.cgp
      .findAllResults(type, Object.assign({}, params, { interval: this.uiIntervalToServer(params.interval) }))
      .then(({ data }) => {
        runInAction(() => {
          if (type === 'nomination') {
            this.resultsNomination = data;
          } else if (type === 'payout') {
            this.resultsPayout = data;
          } else {
            this.resultsAllocation = data;
          }
        });
      })
      .catch(() => {
        runInAction(() => {
          if (type === 'nomination') {
            this.resultsNomination = { items: [], count: 0 };
          } else if (type === 'payout') {
            this.resultsPayout = { items: [], count: 0 };
          } else {
            this.resultsAllocation = { items: [], count: 0 };
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.results = false;
        });
      });
  }
}

decorate(CGPStore, {
  relevantInterval: observable,
  votesAllocation: observable,
  votesPayout: observable,
  resultsAllocation: observable,
  resultsPayout: observable,
  payoutBallots: observable,
  loading: observable,
  loadRelevantInterval: action,
  loadVotes: action,
  loadResults: action,
  currentInterval: computed,
  intervalLength: computed,
  snapshotBlock: computed,
  tallyBlock: computed,
});

function validateType(type) {
  return ['nomination', 'allocation', 'payout'].includes(type);
}
