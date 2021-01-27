import React from 'react';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import AssetUtils from '../../../../lib/AssetUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import TextUtils from '../../../../lib/TextUtils';

class KeyholdersTab extends React.Component {
  getTableColumns() {
    const { assetStore } = this.props.rootStore;
    const totalIssued = Number(assetStore.asset.issued || 0);
    return [
      {
        Header: 'RANK',
        Cell: (data) => TextUtils.formatNumber(data.index + 1 + data.page * data.pageSize),
      },
      {
        Header: 'ADDRESS',
        accessor: 'address',
        minWidth: config.ui.table.minCellWidth,
        Cell: (data) => <HashLink url={`/address/${data.value}`} hash={data.value} />,
      },
      {
        Header: 'QUANTITY',
        accessor: 'balance',
        Cell: (data) =>
          AssetUtils.getAmountDivided(data.value),
      },
      {
        Header: '%',
        accessor: 'balance',
        Cell: ({ value }) => {
          return (totalIssued ? (Number(value) / totalIssued) * 100 : 0) + '%';
        },
      },
    ];
  }

  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setAssetKeyholdersTableData.bind(uiStore);
  }

  forceReload() {
    this.props.rootStore.uiStore.setAssetKeyholdersTableData({ force: true });
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
    const assetStore = this.props.rootStore.assetStore;
    const uiStore = this.props.rootStore.uiStore;

    return (
      <TabPanel>
        <ItemsTable
          columns={this.getTableColumns()}
          loading={assetStore.loading.assetKeyholders}
          itemsCount={assetStore.assetKeyholdersCount}
          items={assetStore.assetKeyholders}
          pageSize={uiStore.state.assetKeyholdersTable.pageSize}
          curPage={uiStore.state.assetKeyholdersTable.curPage}
          tableDataSetter={this.tableDataSetter}
          topContent={
            <div>
              {TextUtils.formatNumber(assetStore.assetKeyholdersCount)} unique keyholders found for
              this asset
            </div>
          }
        />
      </TabPanel>
    );
  }
}
export default inject('rootStore')(
  observer(
    WithSetIdsOnUiStore(observer(KeyholdersTab), 'setAssetKeyholdersTableData', ['asset'], true)
  )
);
