import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom'; 
import blockStore from '../../store/BlockStore';
import RouterUtils from '../../lib/RouterUtils.js';
import TextUtils from '../../lib/TextUtils.js';
import Loading from '../../components/Loading/Loading.jsx';
import HashLink from '../../components/HashLink/HashLink.jsx';
import SearchResultsTable from '../../components/SearchResultsTable/SearchResultsTable.jsx';
import './SearchResults.css';

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
              <h1 className="d-block d-sm-inline-block text-white mb-1 mb-lg-5">
                {results.total? `${results.total} Search Results` : 'No search results found for'}
                <div className="search-string text-light">{blockStore.searchString}</div>
              </h1>
            </div>
          </div>
          <div className="row">
            <div className="col-sm">
              <SearchResultsTable items={results.items.blocks} title="BLOCKS" columns={[
                { accessor: 'blockNumber', cell: (data) => <Link to={`/blocks/${data}`}>{data}</Link> },
                { accessor: 'timestamp', cell: (data) => TextUtils.getDateStringFromTimestamp(data)}
              ]} />
              <SearchResultsTable items={results.items.transactions} title="TRANSACTIONS" columns={[
                { accessor: 'hash', cell: (data) => <HashLink url={`/tx/${data}`} hash={data} /> }
              ]} />
              <SearchResultsTable items={results.items.addresses} title="ADDRESSES" columns={[
                { accessor: 'address', cell: (data) => <HashLink url={`/address/${data}`} hash={data} /> }
              ]} />
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default observer(SearchResultsPage);
