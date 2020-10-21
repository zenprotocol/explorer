import { observable, decorate, action, runInAction, computed } from 'mobx';
import Service from '../lib/ApiService';
import SearchUtils from '../lib/SearchUtils';

export default class SearchStore {
  constructor(rootStore) {
    this.rootStore = rootStore;
    this.searchString = '';
    this.searchStringPrev = '';
    this.searchResults = {};
    this.loading = {
      searchResults: false,
    };

    this.resetSearchResults();
  }

  setSearchString(search) {
    this.searchString = search;
  }

  clearSearchString() {
    this.searchString = '';
    this.searchStringPrev = '';
  }

  search(value, reset = true) {
    if (!SearchUtils.validateSearchString(value) || value === this.searchStringPrev) {
      return Promise.resolve();
    }

    if(reset) {
      this.resetSearchResults();
    }
    this.searchStringPrev = this.searchString;
    this.searchString = value;
    this.loading.searchResults = true;

    return Service.search
      .searchAll(value)
      .then(response => {
        runInAction(() => {
          if (response.success) {
            this.searchResults = response.data;
          }
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.loading.searchResults = false;
        });
      });
  }

  resetSearchResults() {
    this.searchResults = {
      total: 0,
      items: [],
    };
  }

  get searchStringValid() {
    return SearchUtils.validateSearchString(this.searchString);
  }
}

decorate(SearchStore, {
  searchString: observable,
  searchStringPrev: observable,
  searchResults: observable,
  loading: observable,
  setSearchString: action,
  clearSearchString: action,
  search: action,
  searchStringValid: computed,
  resetSearchResults: action,
});
