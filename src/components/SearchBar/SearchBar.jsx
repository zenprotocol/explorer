import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore.js';

class SearchBar extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    blockStore.setSearchString(event.target.value.trim());
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.history.push(`/search/${blockStore.searchString}`);
  }

  

  render() {
    return (
      <form onSubmit={this.handleSubmit} className="form-inline my-2 my-lg-0">
        <input
          value={blockStore.searchString}
          onChange={this.handleChange}
          className="form-control mr-sm-2"
          type="search"
          placeholder="Search"
          aria-label="Search"
        />
      </form>
    );
  }
}

SearchBar.propTypes = {
  history: PropTypes.object,
};

export default withRouter(observer(SearchBar));
