import React, { Component } from 'react';
import { observer } from 'mobx-react';
import blockStore from '../../store/BlockStore';
import RouterUtils from '../../lib/RouterUtils.js';
import Loading from '../../components/Loading/Loading.jsx';
import BlockNumberResults from './BlockNumberResults.jsx';
import TransactionResults from './TransactionResults.jsx';
import AddressResults from './AddressResults.jsx';

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
    if (!results || !results.items) {
      return null;
    }
    return (
      <div className="SearchResults">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <h1 className="d-block d-sm-inline-block text-white mb-1 mb-lg-5">{results.total} Search Results</h1>
              <div className="search-string">{blockStore.searchString}</div>
            </div>
          </div>
          <div className="row">
            <div className="col-sm">
              <BlockNumberResults items={results.items.blocks} />
              <TransactionResults items={results.items.transactions} />
              <AddressResults items={results.items.addresses} />
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default observer(SearchResultsPage);
