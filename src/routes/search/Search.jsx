import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import blockStore from '../../store/BlockStore';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import AssetUtils from '../../lib/AssetUtils';
import Loading from '../../components/Loading/Loading';
import SearchResultsTable from '../../components/SearchResultsTable/SearchResultsTable';
import './Search.css';

class SearchResultsPage extends Component {
  componentDidMount() {
    const { search } = RouterUtils.getRouteParams(this.props);
    this.search(search);
  }

  componentDidUpdate(prevProps) {
    const { search } = RouterUtils.getRouteParams(this.props);
    const prevParams = RouterUtils.getRouteParams(prevProps);
    if (prevParams.search !== search) {
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

    const { search } = RouterUtils.getRouteParams(this.props);

    const results = blockStore.searchResults;

    return (
      <div className="SearchResults">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <h1 className="d-block d-sm-inline-block text-white mb-1 mb-lg-5">
                {results.total ? `${results.total} Search Results` : 'No search results found for'}
                <div className="search-string text-light">{search}</div>
              </h1>
            </div>
          </div>
          <div className="row">
            <div className="col-sm">
              <SearchResultsTable
                items={results.items.transactions}
                title="TRANSACTIONS"
                columns={[
                  {
                    accessor: 'hash',
                    cell: data => (
                      <Link className="break-word" to={`/tx/${data}`}>
                        {this.getHighlightedSearchResult(search, data)}
                      </Link>
                    ),
                  },
                  {
                    accessor: 'Block.blockNumber',
                    cell: data => (
                      <span>
                        Block <Link to={`/blocks/${data}`}>{data}</Link>
                      </span>
                    ),
                  },
                  {
                    accessor: 'Block.timestamp',
                    cell: data => TextUtils.getDateStringFromTimestamp(data),
                  },
                ]}
              />
              <SearchResultsTable
                items={results.items.blocks}
                title="BLOCKS"
                columns={[
                  {
                    accessor: 'blockNumber',
                    cell: data => <Link to={`/blocks/${data}`}>{this.getHighlightedSearchResult(search, data)}</Link>,
                  },
                  {
                    accessor: 'hash',
                    cell: data => <Link to={`/blocks/${data}`}>{this.getHighlightedSearchResult(search, data)}</Link>,
                  },
                  {
                    accessor: 'timestamp',
                    cell: data => TextUtils.getDateStringFromTimestamp(data),
                  },
                  { accessor: 'transactionCount', cell: data => <span>{data} txns</span> },
                ]}
              />
              <SearchResultsTable
                items={results.items.addresses}
                title="ADDRESSES"
                columns={[
                  {
                    accessor: 'address',
                    cell: data => (
                      <Link to={`/address/${data}`}>{this.getHighlightedSearchResult(search, data)}</Link>
                    ),
                  },
                  { accessor: 'txCount', cell: data => <span>{data} txns</span> },
                  { accessor: 'balance', cell: data => AssetUtils.getAmountString('00', data) },
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  getHighlightedSearchResult(searchString, searchResult) {
    searchResult = String(searchResult);
    const partsWithoutSearchString = searchResult.split(searchString);
    if (partsWithoutSearchString.length <= 1) {
      return searchResult;
    }

    return partsWithoutSearchString.reduce(
      (all, cur, index) =>
        index === partsWithoutSearchString.length - 1
          ? [...all, cur]
          : [...all, cur, <mark key={index}>{searchString}</mark>],
      []
    );
  }
}

export default observer(SearchResultsPage);
