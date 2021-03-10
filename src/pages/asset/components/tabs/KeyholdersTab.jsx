import React from 'react';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Decimal } from 'decimal.js';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import AssetUtils from '../../../../lib/AssetUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import TextUtils from '../../../../lib/TextUtils';
import AddressLink from '../../../../components/AddressLink';

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
        Cell: (data) =>
            <AddressLink
              address={data.value}
              active={data.original.isOutputActive}
              hash={data.value}
            />
          ,
      },
      {
        Header: 'QUANTITY',
        accessor: 'balance',
        Cell: (data) => AssetUtils.getAmountDivided(data.value),
      },
      {
        Header: '%',
        accessor: 'balance',
        Cell: ({ value }) => {
          const maxDecimal = 15;
          const d = new Decimal(value || 0).div(totalIssued || 1).times(100);
          const lessThanDecimalPlaces = new Decimal(d.toFixed(maxDecimal)).isZero();
          const final = lessThanDecimalPlaces
            ? '< 0.000000000000001'
            : d.toFixed(Math.min(d.decimalPlaces(), maxDecimal));
          return (totalIssued ? final : 0) + '%';
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
