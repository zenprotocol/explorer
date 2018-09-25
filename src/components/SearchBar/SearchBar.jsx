import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import SearchUtils from '../../lib/SearchUtils.js';
import blockStore from '../../store/BlockStore.js';
import './SearchBar.css';

const SUBMIT_AFTER_MS = 1000;
const SUBMIT_IMMEDIATE_MS = 100;

class SearchBar extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.submit = this.submit.bind(this);
    this.canSearchImmediately = this.canSearchImmediately.bind(this);
  }

  handleChange(event) {
    blockStore.setSearchString(SearchUtils.formatSearchString(event.target.value));
    clearTimeout(this.timeout);
    const time = this.canSearchImmediately(blockStore.searchString) ? SUBMIT_IMMEDIATE_MS : SUBMIT_AFTER_MS;
    this.timeout = setTimeout(this.submit, time);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.submit();
  }

  submit() {
    clearTimeout(this.timeout);
    if (blockStore.searchStringValid && blockStore.searchString !== blockStore.searchStringPrev) {
      this.props.history.push(`/search/${blockStore.searchString}`);
    }
  }

  canSearchImmediately(search) {
    return search.indexOf('zen1') === 0 && search.length > 50;
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="SearchBar form-search my-3 my-lg-0">
        <div className="input-group">
          <input
            value={blockStore.searchString}
            onChange={this.handleChange}
            className="input-search form-control"
            type="search"
            placeholder="Search"
            aria-label="Search"
          />
          <div className="input-group-append">
            <button className="btn btn-outline-dark btn-search" type="submit">
              <i className="fas fa-search" />
            </button>
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
