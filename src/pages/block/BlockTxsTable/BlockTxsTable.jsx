import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import config from '../../../lib/Config';
import TextUtils from '../../../lib/TextUtils';
import AssetUtils from '../../../lib/AssetUtils';
import HashLink from '../../../components/HashLink';
import ItemsTable from '../../../components/ItemsTable';
import PageTitle from '../../../components/PageTitle';
import { TransactionAssetLoader } from '../../../components/Transactions';

class BlockTxsTable extends Component {
  get blockStore() {
    return this.props.rootStore.blockStore;
  }

  get uiStore() {
    return this.props.rootStore.uiStore;
  }

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
        Header: 'Total Moved',
        accessor: 'totalMoved',
        Cell: data => AssetUtils.getAmountString(data.original.asset, Number(data.value)),
      },
    ];
  }
  render() {
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        loading={this.blockStore.loading.blockTransactionAssets}
        itemsCount={this.blockStore.blockTransactionAssetsCount}
        items={this.blockStore.blockTransactionAssets}
        pageSize={this.uiStore.state.blockTxTable.pageSize}
        curPage={this.uiStore.state.blockTxTable.curPage}
        tableDataSetter={this.uiStore.setBlockTxTableData.bind(this.uiStore)}
        topContent={<PageTitle title="Transactions" margin={false} />}
        SubComponent={row => {
          return (
            <TransactionAssetLoader
              transactionAssets={this.blockStore.blockTransactionAssets}
              index={row.index}
              timestamp={row.original.timestamp}
            />
          );
        }}
      />
    );
  }
}

BlockTxsTable.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(BlockTxsTable));
