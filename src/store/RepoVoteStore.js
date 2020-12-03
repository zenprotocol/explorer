import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/ApiService';

export default class RepoVoteStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.relevantInterval = initialState.relevantInterval || {};
    this.votes = initialState.votes || [];
    this.votesCount = initialState.votesCount || 0;
    this.results = initialState.results || [];
    this.resultsCount = initialState.resultsCount || 0;
    this.recentIntervals = initialState.recentIntervals || [];
    this.loading = {
      relevantInterval: false,
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
  votes: observable,
  votesCount: observable,
  results: observable,
  resultsCount: observable,
  recentIntervals: observable,
  loading: observable,
  loadRelevantInterval: action,
  loadVotes: action,
  loadResults: action,
  loadRecentIntervals: action,
});
