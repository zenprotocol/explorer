import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/ApiService';

export default class RepoVoteStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.relevantInterval = initialState.relevantInterval || {};
    this.currentOrNextInterval = initialState.currentInterval || {};
    this.nextInterval = initialState.nextInterval || {};
    this.votes = initialState.votes || [];
    this.votesCount = initialState.votesCount || 0;
    this.results = initialState.results || [];
    this.resultsCount = initialState.resultsCount || 0;
    this.recentIntervals = initialState.recentIntervals || [];
    this.loading = {
      relevantInterval: false,
      currentOrNextInterval: false,
      nextInterval: false,
      votes: false,
      results: false,
      recentIntervals: false,
    };
  }

  loadRelevantInterval(params = {}) {
    this.loading.relevantInterval = true;

    return Service.votes
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

  loadCurrentOrNextInterval() {
    this.loading.currentOrNextInterval = true;

    return Service.votes
      .findCurrentOrNext()
      .then(({ data }) => {
        runInAction(() => {
          this.currentOrNextInterval = data;
        });
      })
      .catch(error => {
        runInAction(() => {
          this.currentOrNextInterval = {};
          if (error.status === 404) {
            this.currentOrNextInterval.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.currentOrNextInterval = false;
        });
      });
  }

  loadNextInterval(params = {}) {
    this.loading.nextInterval = true;

    return Service.votes
      .findNext(params)
      .then(({ data }) => {
        runInAction(() => {
          this.nextInterval = data;
        });
      })
      .catch(error => {
        runInAction(() => {
          this.nextInterval = {};
          if (error.status === 404) {
            this.nextInterval.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.nextInterval = false;
        });
      });
  }

  loadVotes(params = {}) {
    this.loading.votes = true;

    return Service.votes
      .findAllVotes(params)
      .then(({ data }) => {
        runInAction(() => {
          this.votes = data.items;
          this.votesCount = data.count;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.votes = [];
          this.votesCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.votes = false;
        });
      });
  }

  loadResults(params = {}) {
    this.loading.results = true;

    return Service.votes
      .findAllResults(params)
      .then(({ data }) => {
        runInAction(() => {
          this.results = data.items;
          this.resultsCount = data.count;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.results = [];
          this.resultsCount = 0;
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.results = false;
        });
      });
  }

  loadRecentIntervals(params = {}) {
    this.loading.recentIntervals = true;

    return Service.votes
      .findRecentIntervals(params)
      .then(({ data }) => {
        runInAction(() => {
          this.recentIntervals = data;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.recentIntervals = [];
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.recentIntervals = false;
        });
      });
  }
}

decorate(RepoVoteStore, {
  relevantInterval: observable,
  currentOrNextInterval: observable,
  votes: observable,
  votesCount: observable,
  nextInterval: observable,
  results: observable,
  resultsCount: observable,
  recentIntervals: observable,
  loading: observable,
  loadRelevantInterval: action,
  loadCurrentOrNextInterval: action,
  loadVotes: action,
  loadNextInterval: action,
  loadResults: action,
  loadRecentIntervals: action,
});
