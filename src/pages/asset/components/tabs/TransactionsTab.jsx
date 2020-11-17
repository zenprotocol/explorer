import React from 'react';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import { TransactionAssetLoader } from '../../../../components/Transactions';

class TransactionsTab extends React.Component {
  getTableColumns() {
    return [
      {
        Header: 'TX HASH',
        accessor: 'hash',
        minWidth: config.ui.table.minCellWidth,
        Cell: (data) => <HashLink url={`/tx/${data.value}`} hash={data.value} />,
      },
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: config.ui.table.minCellWidthDate,
        Cell: (data) => TextUtils.getDateStringFromTimestamp(data.value),
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        Cell: (data) => (
          <Link to={`/blocks/${data.value}`}>{TextUtils.formatNumber(data.value)}</Link>
        ),
      },
    ];
  }
  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setAssetTxsTableData.bind(uiStore);
  }

  forceReload() {
    this.props.rootStore.uiStore.setAssetTxsTableData({ force: true });
  }

  componentDidMount() {
    this.reloadOnBlocksCountChange();
  }
  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    // autorun was reacting to unknown properties, use reaction instead
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => this.forceReload()
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  render() {
    const uiStore = this.props.rootStore.uiStore;
    const assetStore = this.props.rootStore.assetStore;
    return (
      <TabPanel>
        <ItemsTable
          columns={this.getTableColumns()}
          loading={assetStore.loading.assetTxs}
          itemsCount={assetStore.assetTxsCount}
          items={assetStore.assetTxs}
          pageSize={uiStore.state.assetTxsTable.pageSize}
          curPage={uiStore.state.assetTxsTable.curPage}
          tableDataSetter={this.tableDataSetter}
          topContent={
            <div>
              Total of {TextUtils.formatNumber(assetStore.assetTxsCount)} transactions found
              involving this asset
            </div>
          }
          SubComponent={(row) => {
            return (
              <TransactionAssetLoader
                transactions={assetStore.assetTxs}
                index={row.index}
                asset={assetStore.asset.asset}
                showAsset={false}
              />
            );
          }}
        />
      </TabPanel>
    );
  }
}

export default inject('rootStore')(
  observer(WithSetIdsOnUiStore(observer(TransactionsTab), 'setAssetTxsTableData', ['asset'], true))
);
