import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import config from '../../../lib/Config';
import TextUtils from '../../../lib/TextUtils';
import HashLink from '../../../components/HashLink';
import { ItemsTable } from '../../../components/ItemsTable';
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
        Header: 'TX HASH',
        accessor: 'hash',
        minWidth: config.ui.table.minCellWidth,
        Cell: data => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
        },
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
        accessor: 'isCoinbase',
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
        loading={this.blockStore.loading.blockTxs}
        itemsCount={this.blockStore.blockTxsCount}
        items={this.blockStore.blockTxs}
        pageSize={this.uiStore.state.blockTxTable.pageSize}
        curPage={this.uiStore.state.blockTxTable.curPage}
        tableDataSetter={this.uiStore.setBlockTxTableData.bind(this.uiStore)}
        topContent={<PageTitle title="Transactions" margin={false} />}
        SubComponent={row => {
          return (
            <TransactionAssetLoader
              transactions={this.blockStore.blockTxs}
              index={row.index}
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
