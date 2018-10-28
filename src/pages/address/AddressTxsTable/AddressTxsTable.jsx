import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import uiStore from '../../../store/UIStore';
import AssetUtils from '../../../lib/AssetUtils';
import TextUtils from '../../../lib/TextUtils';
import addressStore from '../../../store/AddressStore';
import HashLink from '../../../components/HashLink';
import ItemsTable from '../../../components/ItemsTable';
import PageTitle from '../../../components/PageTitle';
import { TransactionAssetLoader } from '../../../components/Transactions';

class AddressTxsTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Asset',
        accessor: 'asset',
        minWidth: 130,
        Cell: function(data) {
          return <HashLink hash={AssetUtils.getAssetNameFromCode(data.value)} value={data.value} />;
        },
      },
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: 130,
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
        minWidth: 130,
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
  render() {
    const address = this.props.address;
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        hideOnMobile={['blockHash', 'isCoinbaseTx']}
        loading={addressStore.loading.addressTransactionAssets}
        itemsCount={addressStore.addressTransactionAssetsCount}
        items={addressStore.addressTransactionAssets}
        pageSize={uiStore.addressTxAssetsTable.pageSize}
        curPage={uiStore.addressTxAssetsTable.curPage}
        tableDataSetter={uiStore.setAddressTxAssetsTableData.bind(uiStore)}
        topContent={<PageTitle title="Transactions" margin={false} />}
        SubComponent={row => {
          const addressFoundIn = [];
          if (address) {
            Number(row.original.outputSum) !== 0 && addressFoundIn.push('output');
            Number(row.original.inputSum) !== 0 && addressFoundIn.push('input');
          }
          return (
            <TransactionAssetLoader
              transactionAssets={addressStore.addressTransactionAssets}
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
