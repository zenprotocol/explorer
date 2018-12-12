import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Link, Redirect } from 'react-router-dom';
import classNames from 'classnames';
import { Helmet } from 'react-helmet';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import SearchUtils from '../../lib/SearchUtils';
import AssetUtils from '../../lib/AssetUtils';
import AddressUtils from '../../lib/AddressUtils';
import Loading from '../../components/Loading';
import SearchResultsTable from './SearchResultsTable';
import Page from '../../components/Page';
import HashLink from '../../components/HashLink';
import AddressLink from '../../components/AddressLink';
import './Search.scss';

class SearchResultsPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      initialSearchDone: false,
    };
  }

  get searchStore() {
    return this.props.rootStore.searchStore;
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
    this.searchStore.clearSearchString();
    this.blurSearchBar();
  }

  blurSearchBar() {
    const el = document.querySelector(':focus');
    if (el) {
      setTimeout(() => { el.blur(); }, 1);
    }
  }

  search(value) {
    const search = SearchUtils.formatSearchString(value);
    if (!this.redirectBeforeSearch(search)) {
      this.searchStore.search(search);
      this.setState({ initialSearchDone: true });
    }
  }

  redirectBeforeSearch(search) {
    let redirect = false;
    if (search === '00' || search === 'zp') {
      this.props.history.push('/assets/00');
      redirect = true;
    } else if (AddressUtils.isComplete(search)) {
      if (AddressUtils.isContract(search)) {
        this.props.history.push(`/contracts/${search}`);
        redirect = true;
      } else {
        this.props.history.push(`/address/${search}`);
        redirect = true;
      }
    }
    return redirect;
  }

  render() {
    if (!this.state.initialSearchDone) {
      return null;
    }
    if (this.searchStore.loading.searchResults) {
      return <Loading />;
    }

    let { search } = RouterUtils.getRouteParams(this.props);
    search = SearchUtils.formatSearchString(search);

    const results = this.searchStore.searchResults;
    const total = results.total;
    const { blocks, transactions, addresses, contracts, assets, outputs } = results.items;

    if (total === 1) {
      let redirectTo = '';
      if (blocks.length > 0) {
        redirectTo = `/blocks/${blocks[0].blockNumber}`;
      } else if (transactions.length > 0) {
        redirectTo = `/tx/${transactions[0].hash}`;
      } else if (addresses.length > 0) {
        redirectTo = `/address/${addresses[0].address}`;
      } else if (contracts.length > 0) {
        redirectTo = `/contracts/${contracts[0].address}`;
      } else if (assets.length > 0) {
        redirectTo = `/assets/${assets[0].asset}`;
      } else if (outputs.length > 0) {
        redirectTo = `/tx/${outputs[0].Transaction.hash}`;
      }

      if (redirectTo) {
        return <Redirect to={redirectTo} />;
      }
    }

    return (
      <Page className="SearchResults">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Search')}</title>
        </Helmet>
        <section>
          <div className="row">
            <div className="col-sm">
              <h1 className="d-block text-white mb-1 mb-lg-5">
                {total ? `${total} Search Results For:` : 'No search results found for:'}
                <div
                  className={classNames('search-string text-light', {
                    'border-top border-dark mt-3': !total,
                  })}
                >
                  {search}
                </div>
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
                      <HashLink
                        truncate={false}
                        url={`/tx/${data}`}
                        hash={this.getHighlightedSearchResult(search, data)}
                        value={data}
                      />
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
                    cell: data => <HashLink url={`/tx/${data}`} hash={data} />,
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
                    cell: (data, row) =>
                      this.getHighlightedSearchResult(
                        search,
                        AssetUtils.getAmountString(row.asset, data),
                        true
                      ),
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
                      <HashLink
                        truncate={false}
                        url={`/blocks/${data}`}
                        hash={this.getHighlightedSearchResult(search, data)}
                        value={data}
                      />
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
                      <AddressLink
                        address={data}
                        truncate={false}
                        hash={this.getHighlightedSearchResult(search, data)}
                        value={data}
                      />
                    ),
                  },
                ]}
              />
              <SearchResultsTable
                items={contracts}
                title="CONTRACTS"
                columns={[
                  {
                    accessor: 'address',
                    cell: data => (
                      <AddressLink
                        address={data}
                        truncate={false}
                        hash={this.getHighlightedSearchResult(search, data)}
                        value={data}
                      />
                    ),
                  },
                ]}
              />
              <SearchResultsTable
                items={assets}
                title="ASSETS"
                columns={[
                  {
                    accessor: 'asset',
                    cell: data => (
                      <HashLink
                        truncate={false}
                        url={`/assets/${data}`}
                        hash={this.getHighlightedSearchResult(search, data)}
                        value={data}
                      />
                    ),
                  },
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
    if (formatNumbers && !isNaN(Number(searchString))) {
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

SearchResultsPage.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(SearchResultsPage));
