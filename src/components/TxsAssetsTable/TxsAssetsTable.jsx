import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import classNames from 'classnames';
import AssetUtils from '../../lib/AssetUtils';
import TextUtils from '../../lib/TextUtils';
import Config from '../../lib/Config';
import HashLink from '../HashLink/HashLink.jsx';
import GenericTable from '../GenericTable/GenericTable.jsx';
import TransactionAssetLoader from '../Transactions/Asset/TransactionAssetLoader.jsx';
import './TxsAssetsTable.css';

class TxsAssetsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      windowWidth: 0,
    };

    this.setPageSize = this.setPageSize.bind(this);
    this.onPageChange = this.onPageChange.bind(this);
    this.setWindowWidth = debounce(this.setWindowWidth, 200).bind(this);
  }

  componentDidMount() {
    this.setWindowWidth();
    window.addEventListener('resize', this.setWindowWidth);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setWindowWidth);
  }

  setWindowWidth() {
    this.setState({ windowWidth: window.innerWidth });
  }

  getTableColumns() {
    const availableColumns = {
      asset: {
        Header: 'Asset',
        accessor: 'asset',
        Cell: function(data) {
          return AssetUtils.getTypeFromCode(data.value);
        },
      },
      timestamp: {
        Header: 'Timestamp',
        accessor: 'timestamp',
        Cell: function(data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      blockHash: {
        Header: 'Block',
        accessor: 'blockHash',
        Cell: data => {
          return <HashLink url={`/blocks/${data.value}`} hash={data.value} />;
        },
      },
      txHash: {
        Header: 'TX',
        accessor: 'txHash',
        Cell: data => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
        },
      },
      isCoinbaseTx: {
        Header: '',
        accessor: 'isCoinbaseTx',
        Cell: data => {
          return data.value ? 'Coinbase' : '';
        },
      },
      outputSum: {
        Header: 'Output Sum',
        accessor: 'outputSum',
        Cell: function(data) {
          return AssetUtils.getAmountString(data.original.asset, Number(data.value));
        },
      },
      inputSum: {
        Header: 'Input Sum',
        accessor: 'inputSum',
        Cell: function(data) {
          return AssetUtils.getAmountString(data.original.asset, Number(data.value));
        },
      },
      totalSum: {
        Header: 'Balance',
        accessor: 'totalSum',
        Cell: function(data) {
          const isNegative = Number(data.value) < 0;
          return (
            <span className={isNegative ? 'negative' : 'positive'}>
              {AssetUtils.getAmountString(data.original.asset, Number(data.value))}
            </span>
          );
        },
      },
    };
    const columns = [
      ...this.props.columns.map(column => {
        const hideOnMobileObj = this.props.hideOnMobile.includes(column)
          ? { show: this.state.windowWidth >= Config.ui.sizes.breakpointMd }
          : {};
        return Object.assign({}, availableColumns[column], hideOnMobileObj);
      }),
      {
        Header: 'Expand',
        expander: true,
        width: 65,
        Expander: ({ isExpanded }) => (
          <div className="expand">
            {isExpanded ? <i className="fas fa-angle-up" /> : <i className="fas fa-angle-down" />}
          </div>
        ),
      },
    ];

    return columns;
  }

  setPageSize(event) {
    const { pageSize, curPage, tableDataSetter } = this.props;
    const newPageSize = Number(event.target.value);
    const newCurPage = Math.floor((pageSize * curPage) / newPageSize);
    tableDataSetter({ pageSize: newPageSize, curPage: newCurPage });
  }

  onPageChange(page) {
    this.props.tableDataSetter({ curPage: page });
  }

  render() {
    const { loading, assetCount, assets, pageSize, curPage } = this.props;
    const numOfPages = Math.ceil(assetCount / pageSize);
    return (
      <div className={classNames('TxsAssetsTable', { loading })}>
        <div className="clearfix">
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transactions</h1>
          <div className="TxsAssetsTable-pageSizes form-inline float-sm-right">
            <span className="mr-2 d-none d-md-inline-block">SHOW</span>
            <select
              value={pageSize}
              onChange={this.setPageSize}
              className="form-control d-block d-md-inline-block"
            >
              {Config.ui.table.pageSizes.map(pageSize => {
                return (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                );
              })}
            </select>
            <span className="ml-2 d-none d-md-inline-block">ENTRIES</span>
          </div>
        </div>
        <GenericTable
          loading={loading}
          data={assets}
          columns={this.getTableColumns()}
          defaultPageSize={pageSize}
          pages={numOfPages}
          page={curPage}
          pageSizes={Config.ui.table.pageSizes}
          onPageChange={this.onPageChange}
          pageSize={pageSize}
          SubComponent={row => {
            return (
              <TransactionAssetLoader
                transactionAssets={assets}
                index={row.index}
                timestamp={row.original.timestamp}
                total={row.original.totalSum}
              />
            );
          }}
        />
      </div>
    );
  }
}

TxsAssetsTable.defaultProps = {
  columns: ['asset', 'timestamp', 'txHash', 'isCoinbaseTx', 'totalSum'],
  hideOnMobile: [],
  pageSize: 10,
  curPage: 0,
};

TxsAssetsTable.propTypes = {
  columns: PropTypes.array,
  hideOnMobile: PropTypes.array,
  loading: PropTypes.bool,
  assetCount: PropTypes.number,
  assets: PropTypes.array,
  pageSize: PropTypes.number,
  curPage: PropTypes.number,
  tableDataSetter: PropTypes.func.isRequired,
};

export default observer(TxsAssetsTable);
