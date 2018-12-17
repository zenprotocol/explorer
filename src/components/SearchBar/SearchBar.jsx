import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import SearchUtils from '../../lib/SearchUtils';
import './SearchBar.scss';

const SUBMIT_AFTER_MS = 1000;
const SUBMIT_IMMEDIATE_MS = 100;

class SearchBar extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.submit = this.submit.bind(this);
    this.clear = this.clear.bind(this);
    this.canSearchImmediately = this.canSearchImmediately.bind(this);
  }

  get searchStore() {
    return this.props.rootStore.searchStore;
  }

  handleChange(event) {
    this.searchStore.setSearchString(SearchUtils.formatSearchString(event.target.value));
    clearTimeout(this.timeout);
    const time = this.canSearchImmediately(this.searchStore.searchString)
      ? SUBMIT_IMMEDIATE_MS
      : SUBMIT_AFTER_MS;
    this.timeout = setTimeout(this.submit, time);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.submit();
  }

  submit() {
    clearTimeout(this.timeout);
    if (this.searchStore.searchStringValid && this.searchStore.searchString !== this.searchStore.searchStringPrev) {
      this.props.history.push(`/search/${this.searchStore.searchString}`);
    }
  }

  clear() {
    this.searchStore.setSearchString('');
  }

  canSearchImmediately(search) {
    return search.length >= 63;
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="SearchBar form-search my-3 my-lg-0">
        <div className="input-group">
          <input
            value={this.searchStore.searchString}
            onChange={this.handleChange}
            className="input-search form-control"
            type="search"
            placeholder="Search by Address/Tx/Block/Contract/Asset"
            aria-label="Search"
          />
          <div className="input-group-append">
            {this.searchStore.searchString ? (
              <button className="btn btn-outline-dark btn-clear" type="button" onClick={this.clear}>
                <i className="fas fa-times" />
              </button>
            ) : (
              <button className="btn btn-outline-dark btn-search" type="submit">
                <i className="fas fa-search" />
              </button>
            )}
          </div>
        </div>
      </form>
    );
  }
}

SearchBar.propTypes = {
  history: PropTypes.object,
  rootStore: PropTypes.object,
};

export default withRouter(inject('rootStore')(observer(SearchBar)));
