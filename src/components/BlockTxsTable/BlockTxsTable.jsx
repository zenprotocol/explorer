import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import classNames from 'classnames';
import GenericTable from '../GenericTable/GenericTable';
import uiStore from '../../store/UIStore';
import blockStore from '../../store/BlockStore';
import AssetUtils from '../../lib/AssetUtils';
import HashLink from '../HashLink/HashLink';
import TransactionAssetLoader from '../Transactions/Asset/TransactionAssetLoader';
import './BlockTxsTable.css';

class BlockTxsTable extends Component {
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
        Header: '',
        accessor: 'isCoinbaseTx',
        Cell: data => {
          return data.value ? 'Coinbase' : '';
        },
      },
      {
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
      {
        Header: 'Expand',
        expander: true,
        width: 65,
        Expander: ({ isExpanded }) => <div className="expand">{isExpanded ? <i className="fas fa-angle-up"></i> : <i className="fas fa-angle-down"></i>}</div>,
      },
    ];
  }

  setPageSize(event) {
    const pageSize = Number(event.target.value);
    const curPage = Math.floor((uiStore.blockTxTable.pageSize * uiStore.blockTxTable.curPage) / pageSize);
    uiStore.setBlockTxTableData({ pageSize, curPage });
  }

  onPageChange(page) {
    uiStore.setBlockTxTableData({ curPage: page });
  }

  render() {
    const numOfPages = Math.ceil(blockStore.blockTransactionAssetsCount / uiStore.blockTxTable.pageSize);
    const assets = blockStore.blockTransactionAssets;
    return (
      <div className={classNames('AddressTxsTable', {loading: blockStore.loading.blockTransactionAssets})}>
        <div className="clearfix">
          <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transactions</h1>
          <div className="AddressTxsTable-pageSizes form-inline float-sm-right">
            <span className="mr-2 d-none d-md-inline-block">SHOW</span>
            <select
              value={uiStore.blockTxTable.pageSize}
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
          loading={blockStore.loading.blockTransactionAssets}
          data={assets}
          columns={this.getTableColumns()}
          defaultPageSize={uiStore.blockTxTable.pageSize}
          pages={numOfPages}
          page={uiStore.blockTxTable.curPage}
          pageSizes={this.props.pageSizes}
          onPageChange={this.onPageChange}
          pageSize={uiStore.blockTxTable.pageSize}
          SubComponent={row => {
            return (
              <TransactionAssetLoader 
                transactionAssets={blockStore.blockTransactionAssets}
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

BlockTxsTable.defaultProps = {
  pageSizes: [5, 10, 20, 50, 100],
};

BlockTxsTable.propTypes = {
  pageSizes: PropTypes.array,
};

export default observer(BlockTxsTable);
