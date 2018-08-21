import React, { Component } from 'react';
import { observer } from 'mobx-react';
import {Link} from 'react-router-dom';
import blockStore from '../../store/BlockStore';
import RouterUtils from '../../lib/RouterUtils.js';
import Loading from '../../components/Loading/Loading.jsx';

class SearchResultsPage extends Component {
  componentDidMount() {
    const {search} = RouterUtils.getRouteParams(this.props);
    this.search(search);
  }

  componentDidUpdate(prevProps) {
    const {search} = RouterUtils.getRouteParams(this.props);
    const prevParams = RouterUtils.getRouteParams(prevProps);
    if(prevParams.search !== search) {
      this.search(search);
    }
  }

  search(value) {
    blockStore.search(value);
  }

  render() {
    if (blockStore.loading.searchResults) {
      return <Loading />;
    }

    const results = blockStore.searchResults;
    if (!results || results === {}) {
      return null;
    }
    
    return (
      <div className="SearchResults">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">{results.total} Search Results</h1>
            </div>
          </div>
          <div className="row">
            
          </div>
        </section>
      </div>
    );
  }
}

export default observer(SearchResultsPage);
