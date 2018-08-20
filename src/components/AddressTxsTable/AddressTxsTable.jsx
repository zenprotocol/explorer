import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import uiStore from '../../store/UIStore';
import AssetUtils from '../../lib/AssetUtils';
import TextUtils from '../../lib/TextUtils';
import blockStore from '../../store/BlockStore';
import HashLink from '../HashLink/HashLink.jsx';
import ItemsTable from '../ItemsTable/ItemsTable.jsx';
import TransactionAssetLoader from '../Transactions/Asset/TransactionAssetLoader.jsx';

class AddressTxsTable extends Component {
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
        Header: 'Timestamp',
        accessor: 'timestamp',
        Cell: function(data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
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
  render() {
    const address = this.props.address;
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        hideOnMobile={['blockHash', 'isCoinbaseTx']}
        loading={blockStore.loading.addressTransactionAssets}
        itemsCount={blockStore.addressTransactionAssetsCount}
        items={blockStore.addressTransactionAssets}
        pageSize={uiStore.addressTxTable.pageSize}
        curPage={uiStore.addressTxTable.curPage}
        tableDataSetter={uiStore.setAddressTxTableData.bind(uiStore)}
        title="Transactions"
        SubComponent={row => {
          const addressFoundIn = [];
          if (address) {
            Number(row.original.outputSum) !== 0 && addressFoundIn.push('output');
            Number(row.original.inputSum) !== 0 && addressFoundIn.push('input');
          }
          return (
            <TransactionAssetLoader
              transactionAssets={blockStore.addressTransactionAssets}
              index={row.index}
              timestamp={row.original.timestamp}
              total={Number(row.original.totalSum)}
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
};

export default observer(AddressTxsTable);
