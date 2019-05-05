import { observable, decorate, action, runInAction } from 'mobx';
import Service from '../lib/Service';

export default class RepoVoteStore {
  constructor(rootStore, initialState = {}) {
    this.rootStore = rootStore;
    this.tally = initialState.tally || {};
    this.next = initialState.next || {};
    this.votes = initialState.votes || [];
    this.votesCount = initialState.votesCount || 0;
    this.loading = {
      interval: false,
      next: false,
      votes: false,
    };
  }

  loadTally(params = {}) {
    this.loading.interval = true;

    return Service.votes
      .findCurrent(params)
      .then(({ data }) => {
        runInAction(() => {
          this.tally = data;
        });
      })
      .catch(error => {
        runInAction(() => {
          this.tally = {};
          if (error.status === 404) {
            this.tally.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.interval = false;
        });
      });
  }

  loadNext(params = {}) {
    this.loading.next = true;

    return Service.votes
      .findNext(params)
      .then(({ data }) => {
        runInAction(() => {
          this.next = data;
        });
      })
      .catch(error => {
        runInAction(() => {
          this.next = {};
          if (error.status === 404) {
            this.next.status = 404;
          }
        });
      })
      .then(() => {
        runInAction(() => {
          this.loading.next = false;
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
}

decorate(RepoVoteStore, {
  tally: observable,
  votes: observable,
  votesCount: observable,
  loading: observable,
  loadTally: action,
  loadVotes: action,
});
