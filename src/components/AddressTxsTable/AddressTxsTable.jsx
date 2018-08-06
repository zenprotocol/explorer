import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import GenericTable from '../GenericTable/GenericTable.jsx';
import uiStore from '../../store/UIStore';
import blockStore from '../../store/BlockStore';
import AssetUtils from '../../lib/AssetUtils.js';
import HashLink from '../HashLink/HashLink.jsx';
import TransactionAsset from '../Transactions/Asset/TransactionAsset.jsx';
import './AddressTxsTable.css';

class AddressTxsTable extends Component {
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
    return [
      {
        Header: 'Asset',
        accessor: 'asset',
        Cell: function(data) {
          return AssetUtils.getTypeFromCode(data.value);
        },
      },
      {
        Header: 'TX',
        accessor: 'txHash',
        Cell: data => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
        },
      },
      {
        Header: 'Block',
        accessor: 'blockHash',
        Cell: data => {
          return <HashLink url={`/blocks/${data.value}`} hash={data.value} />;
        },
      },
      {
        Header: 'Balance',
        accessor: 'addressTotal',
        Cell: function(data) {
          const isNegative = Number(data.value) < 0;
          return (
            <span className={isNegative ? 'negative' : 'positive'}>
              {AssetUtils.getAmountString(data.original, Number(data.value))}
            </span>
          );
        },
      },
      {
        Header: 'Expand',
        expander: true,
        width: 65,
        Expander: ({ isExpanded }) => <div>{isExpanded ? <i className="fas fa-minus"></i> : <i className="fas fa-plus"></i>}</div>,
        style: {
          cursor: 'pointer',
          fontSize: 25,
          padding: '0',
          textAlign: 'center',
          userSelect: 'none',
        },
      },
    ];
  }

  setPageSize(event) {
    const pageSize = Number(event.target.value);
    const curPage = Math.floor((uiStore.addressTxTable.pageSize * uiStore.addressTxTable.curPage) / pageSize);
    uiStore.setAddressTxTableData({ pageSize, curPage });
  }

  onPageChange(page) {
    uiStore.setAddressTxTableData({ curPage: page });
  }

  concatAllTxAssets(transactions) {
    return [].concat.apply(
      [],
      transactions.map(tx => {
        return tx.assets;
      })
    );
  }

  render() {
    const numOfPages = Math.ceil(blockStore.transactionsCount / uiStore.addressTxTable.pageSize);
    const assets = this.concatAllTxAssets(blockStore.transactions);
    return (
      <div className="AddressTxsTable">
        <div className="clearfix">
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transactions</h1>
          <div className="AddressTxsTable-pageSizes form-inline float-sm-right">
            <span className="mr-2 d-none d-md-inline-block">SHOW</span>
            <select
              value={uiStore.addressTxTable.pageSize}
              onChange={this.setPageSize}
              className="form-control d-block d-md-inline-block"
            >
              {this.props.pageSizes.map(pageSize => {
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
          loading={blockStore.loading.transactions}
          data={assets}
          columns={this.getTableColumns()}
          defaultPageSize={uiStore.addressTxTable.pageSize}
          pages={numOfPages}
          page={uiStore.addressTxTable.curPage}
          pageSizes={this.props.pageSizes}
          onPageChange={this.onPageChange}
          pageSize={uiStore.addressTxTable.pageSize}
          SubComponent={row => {
            return (
              <TransactionAsset
                asset={row.original}
                showHeader={true}
                address={uiStore.addressTxTable.address}
                timestamp={row.original.timestamp}
              />
            );
          }}
        />
      </div>
    );
  }
}

AddressTxsTable.defaultProps = {
  pageSizes: [5, 10, 20, 50, 100],
};

AddressTxsTable.propTypes = {
  pageSizes: PropTypes.array,
};

export default observer(AddressTxsTable);
