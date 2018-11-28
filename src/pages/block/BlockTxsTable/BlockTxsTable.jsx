import React, { Component } from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../../store/UIStore';
import blockStore from '../../../store/BlockStore';
import config from '../../../lib/Config';
import TextUtils from '../../../lib/TextUtils';
import AssetUtils from '../../../lib/AssetUtils';
import HashLink from '../../../components/HashLink/HashLink';
import ItemsTable from '../../../components/ItemsTable/ItemsTable';
import PageTitle from '../../../components/PageTitle';
import TransactionAssetLoader from '../../../components/Transactions/Asset/TransactionAssetLoader';

class BlockTxsTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Hash',
        accessor: 'txHash',
        minWidth: config.ui.table.minCellWidth,
        Cell: data => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
        },
      },
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
        Header: '',
        accessor: 'isCoinbaseTx',
        Cell: data => {
          return data.value ? 'Coinbase' : '';
        },
      },
      {
        Header: 'Total',
        accessor: 'outputSum',
        Cell: data => AssetUtils.getAmountString(data.original.asset, Number(data.value)),
      },
    ];
  }
  render() {
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        loading={blockStore.loading.blockTransactionAssets}
        itemsCount={blockStore.blockTransactionAssetsCount}
        items={blockStore.blockTransactionAssets}
        pageSize={uiStore.blockTxTable.pageSize}
        curPage={uiStore.blockTxTable.curPage}
        tableDataSetter={uiStore.setBlockTxTableData.bind(uiStore)}
        topContent={<PageTitle title="Transactions" margin={false} />}
        SubComponent={row => {
          return (
            <TransactionAssetLoader
              transactionAssets={blockStore.blockTransactionAssets}
              index={row.index}
              timestamp={row.original.timestamp}
            />
          );
        }}
      />
    );
  }
}

export default observer(BlockTxsTable);
