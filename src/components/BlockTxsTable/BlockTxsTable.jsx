import React, { Component } from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../store/UIStore';
import TextUtils from '../../lib/TextUtils';
import blockStore from '../../store/BlockStore';
import HashLink from '../HashLink/HashLink';
import ItemsTable from '../ItemsTable/ItemsTable';
import TransactionAssetLoader from '../Transactions/Asset/TransactionAssetLoader';

class BlockTxsTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Hash',
        accessor: 'txHash',
        Cell: data => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
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
        Header: '',
        accessor: 'isCoinbaseTx',
        Cell: data => {
          return data.value ? 'Coinbase' : '';
        },
      },
    ];
  }
  render() {
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        hideOnMobile={[]}
        loading={blockStore.loading.blockTransactionAssets}
        itemsCount={blockStore.blockTransactionAssetsCount}
        items={blockStore.blockTransactionAssets}
        pageSize={uiStore.blockTxTable.pageSize}
        curPage={uiStore.blockTxTable.curPage}
        tableDataSetter={uiStore.setBlockTxTableData.bind(uiStore)}
        title="Transactions"
        SubComponent={row => {
          return (
            <TransactionAssetLoader
              transactionAssets={blockStore.blockTransactionAssets}
              index={row.index}
              timestamp={row.original.timestamp}
              total={Number(row.original.outputSum)}
            />
          );
        }}
      />
    );
  }
}

export default observer(BlockTxsTable);
