import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../lib/Config';
import AssetUtils from '../../../lib/AssetUtils';
import TextUtils from '../../../lib/TextUtils';
import HashLink from '../../../components/HashLink';
import { ItemsTable } from '../../../components/ItemsTable';
import PageTitle from '../../../components/PageTitle';
import { TransactionAssetLoader } from '../../../components/Transactions';

class AddressTxsTable extends Component {
  get uiStore() {
    return this.props.rootStore.uiStore;
  }
  get addressStore() {
    return this.props.rootStore.addressStore;
  }

  getTableColumns() {
    return [
      {
        Header: 'Asset',
        accessor: 'asset',
        minWidth: config.ui.table.minCellWidth,
        Cell: ({ value }) => (
          <HashLink
            hash={AssetUtils.getAssetNameFromCode(value)}
            value={value}
            url={`/assets/${value}`}
          />
        ),
      },
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: config.ui.table.minCellWidthDate,
        Cell: function(data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        Cell: data => {
          return <Link to={`/blocks/${data.value}`}>{data.value}</Link>;
        },
      },
      {
        Header: 'TX',
        accessor: 'txHash',
        minWidth: config.ui.table.minCellWidth,
        Cell: data => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
        },
      },
      {
        Header: '',
        accessor: 'isCoinbaseTx',
        hideOnMobile: true,
        Cell: data => {
          return data.value ? 'Coinbase' : '';
        },
      },
      {
        Header: 'Amount',
        accessor: 'totalSum',
        Cell: data => {
          const isNegative = Number(data.value) < 0;
          return (
            <span className={isNegative ? 'negative' : 'positive'}>
              {AssetUtils.getAmountString(data.original.asset, Number(data.value))}
            </span>
          );
        },
      },
    ];
  }

  get tableDataSetter() {
    return this.uiStore.setAddressTxAssetsTableData.bind(this.uiStore);
  }

  render() {
    const address = this.props.address;
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        loading={this.addressStore.loading.addressTransactionAssets}
        itemsCount={this.addressStore.addressTransactionAssetsCount}
        items={this.addressStore.addressTransactionAssets}
        pageSize={this.uiStore.state.addressTxAssetsTable.pageSize}
        curPage={this.uiStore.state.addressTxAssetsTable.curPage}
        tableDataSetter={this.tableDataSetter}
        topContent={<PageTitle title="Transactions" margin={false} />}
        SubComponent={row => {
          const addressFoundIn = [];
          if (address) {
            Number(row.original.outputSum) !== 0 && addressFoundIn.push('output');
            Number(row.original.inputSum) !== 0 && addressFoundIn.push('input');
          }
          return (
            <TransactionAssetLoader
              transactionAssets={this.addressStore.addressTransactionAssets}
              index={row.index}
              timestamp={row.original.timestamp}
              address={address}
              addressFoundIn={addressFoundIn}
            />
          );
        }}
      />
    );
  }
}

AddressTxsTable.propTypes = {
  address: PropTypes.string,
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(AddressTxsTable));
