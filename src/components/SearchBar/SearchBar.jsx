import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import SearchUtils from '../../lib/SearchUtils';
import AddressUtils from '../../lib/AddressUtils';
import searchStore from '../../store/SearchStore';
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

  handleChange(event) {
    searchStore.setSearchString(SearchUtils.formatSearchString(event.target.value));
    clearTimeout(this.timeout);
    const time = this.canSearchImmediately(searchStore.searchString)
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
    if (searchStore.searchStringValid && searchStore.searchString !== searchStore.searchStringPrev) {
      this.props.history.push(`/search/${searchStore.searchString}`);
    }
  }

  clear() {
    searchStore.setSearchString('');
  }

  canSearchImmediately(search) {
    return search.length >= 63;
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="SearchBar form-search my-3 my-lg-0">
        <div className="input-group">
          <input
            value={searchStore.searchString}
            onChange={this.handleChange}
            className="input-search form-control"
            type="search"
            placeholder="Search by Address/Tx/Block/Contract/Asset"
            aria-label="Search"
          />
          <div className="input-group-append">
            {searchStore.searchString ? (
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
};

export default withRouter(observer(SearchBar));
