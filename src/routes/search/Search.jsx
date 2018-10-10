import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link, Redirect } from 'react-router-dom';
import classNames from 'classnames';
import blockStore from '../../store/BlockStore';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import SearchUtils from '../../lib/SearchUtils';
import AssetUtils from '../../lib/AssetUtils';
import Loading from '../../components/Loading';
import SearchResultsTable from './SearchResultsTable';
import Page from '../../components/Page';
import './Search.css';

class SearchResultsPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      initialSearchDone: false,
    };
  }
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

  componentWillUnmount() {
    blockStore.clearSearchString();
  }

  search(value) {
    const search = SearchUtils.formatSearchString(value);
    this.redirectBeforeSearch(search);
    blockStore.search(search);
    this.setState({ initialSearchDone: true });
  }

  redirectBeforeSearch(search) {
    if (SearchUtils.isCompleteAddress(search)) {
      this.props.history.push(`/address/${search}`);
    }
  }

  render() {
    if (!this.state.initialSearchDone) {
      return null;
    }
    if (blockStore.loading.searchResults) {
      return <Loading />;
    }

    let { search } = RouterUtils.getRouteParams(this.props);
    search = SearchUtils.formatSearchString(search);

    const results = blockStore.searchResults;
    const total = results.total;
    const { blocks, transactions, addresses, outputs } = results.items;

    if (total === 1) {
      let redirectTo = '';
      if (blocks.length > 0) {
        redirectTo = `/blocks/${blocks[0].blockNumber}`;
      } else if (transactions.length > 0) {
        redirectTo = `/tx/${transactions[0].hash}`;
      } else if (addresses.length > 0) {
        redirectTo = `/address/${addresses[0].address}`;
      } else if (outputs.length > 0) {
        redirectTo = `/tx/${outputs[0].Transaction.hash}`;
      }


      if (redirectTo) {
        return <Redirect to={redirectTo} />;
      }
    }

    return (
      <Page className="SearchResults">
        <section>
          <div className="row">
            <div className="col-sm">
              <h1 className="d-block text-white mb-1 mb-lg-5">
                {total ? `${total} Search Results` : 'No search results found for'}
                <div className={classNames('search-string text-light', {'border-top border-dark mt-3': !total})}>{search}</div>
              </h1>
            </div>
          </div>
          <div className="row">
            <div className="col-sm">
              <SearchResultsTable
                items={transactions}
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
                items={outputs}
                title="ZP TRANSACTIONS"
                columns={[
                  {
                    accessor: 'Transaction.hash',
                    cell: data => (
                      <Link className="break-word" to={`/tx/${data}`}>
                        {data}
                      </Link>
                    ),
                  },
                  {
                    accessor: 'Transaction.Block.blockNumber',
                    cell: data => (
                      <span>
                        Block <Link to={`/blocks/${data}`}>{data}</Link>
                      </span>
                    ),
                  },
                  {
                    accessor: 'Transaction.Block.timestamp',
                    cell: data => TextUtils.getDateStringFromTimestamp(data),
                  },
                  {
                    accessor: 'amount',
                    cell: (data, row) => this.getHighlightedSearchResult(search, AssetUtils.getAmountString(row.asset, data), true),
                  },
                ]}
              />
              <SearchResultsTable
                items={blocks}
                title="BLOCKS"
                columns={[
                  {
                    accessor: 'blockNumber',
                    cell: data => (
                      <Link to={`/blocks/${data}`}>
                        {this.getHighlightedSearchResult(search, data)}
                      </Link>
                    ),
                  },
                  {
                    accessor: 'hash',
                    cell: data => (
                      <Link className="break-word" to={`/blocks/${data}`}>
                        {this.getHighlightedSearchResult(search, data)}
                      </Link>
                    ),
                  },
                  {
                    accessor: 'timestamp',
                    cell: data => TextUtils.getDateStringFromTimestamp(data),
                  },
                  { accessor: 'transactionCount', cell: data => <span>{data} txns</span> },
                ]}
              />
              <SearchResultsTable
                items={addresses}
                title="ADDRESSES"
                columns={[
                  {
                    accessor: 'address',
                    cell: data => (
                      <Link className="break-word" to={`/address/${data}`}>
                        {this.getHighlightedSearchResult(search, data)}
                      </Link>
                    ),
                  },
                  // { accessor: 'txCount', cell: data => <span>{data} txns</span> },
                  // { accessor: 'balance', cell: data => AssetUtils.getAmountString('00', data) },
                ]}
              />
            </div>
          </div>
        </section>
      </Page>
    );
  }

  getHighlightedSearchResult(searchString, searchResult, formatNumbers = false) {
    let formattedSearchResult = String(searchResult);
    if(formatNumbers && !isNaN(Number(searchString))) {
      searchString = TextUtils.formatNumber(searchString);
    }
    const partsWithoutSearchString = formattedSearchResult.split(searchString);
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
