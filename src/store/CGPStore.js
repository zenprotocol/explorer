import { observable, decorate, action, runInAction, computed } from 'mobx';
import Service from '../lib/Service';

export default class CGPStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.relevantInterval = initialState.relevantInterval || {};
    this.votesAllocation = initialState.votesAllocation || { items: [], count: 0 };
    this.votesPayout = initialState.votesPayout || { items: [], count: 0 };
    this.resultsAllocation = initialState.resultsAllocation || { items: [], count: 0 };
    this.resultsPayout = initialState.resultsPayout || { items: [], count: 0 };
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
    return Math.ceil(this.rootStore.blockStore.blocksCount / this.intervalLength);
  }

  get snapshotBlock() {
    return (this.currentInterval - 1) * this.intervalLength + this.intervalLength * 0.9;
  }

  get tallyBlock() {
    return this.currentInterval * this.intervalLength;
  }

  loadRelevantInterval(params = {}) {
    this.loading.relevantInterval = true;

    return Service.cgp
      .findCurrent(params)
      .then(({ data }) => {
        runInAction(() => {
          this.relevantInterval = data;
        });
      })
      .catch(error => {
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
    this.loading.votes = true;

    return Service.cgp
      .findAllVotes(type, params)
      .then(({ data }) => {
        runInAction(() => {
          if (type === 'payout') {
            this.votesPayout = data;
          } else {
            this.votesAllocation = data;
          }
        });
      })
      .catch(() => {
        runInAction(() => {
          if (type === 'payout') {
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
    this.loading.results = true;

    return Service.cgp
      .findAllResults(type, params)
      .then(({ data }) => {
        runInAction(() => {
          if (type === 'payout') {
            this.resultsPayout = data;
          } else {
            this.resultsAllocation = data;
          }
        });
      })
      .catch(() => {
        runInAction(() => {
          if (type === 'payout') {
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

  loadPayoutBallots(type, params = {}) {
    this.loading.payoutBallots = true;

    return Service.cgp
      .findBallots('payout', params)
      .then(({ data }) => {
        runInAction(() => {
          this.payoutBallots = data;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.payoutBallots = { items: [], count: 0 };
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.payoutBallots = false;
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
  loadPayoutBallots: action,
  currentInterval: computed,
  intervalLength: computed,
  snapshotBlock: computed,
  tallyBlock: computed,
});
