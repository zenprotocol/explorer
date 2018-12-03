import React, { Component } from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../../../store/UIStore';
import assetStore from '../../../../store/AssetStore';
import config from '../../../../lib/Config';
import AssetUtils from '../../../../lib/AssetUtils';
import TextUtils from '../../../../lib/TextUtils';
import HashLink from '../../../../components/HashLink';
import ItemsTable from '../../../../components/ItemsTable';
import PageTitle from '../../../../components/PageTitle';

class AssetsTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Asset Identifier',
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
        Header: 'TOKENS OUTSTANDING',
        accessor: 'outstanding',
        Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
      },
      {
        Header: 'TOTAL ISSUED',
        accessor: 'issued',
        Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
      },
      {
        Header: 'DESTROYED',
        accessor: 'destroyed',
        Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
      },
      {
        Header: 'UNIQUE ADDRESSES',
        accessor: 'keyholders',
        Cell: data => TextUtils.formatNumber(data.value),
      },
      {
        Header: 'TXS',
        accessor: 'transactionsCount',
        Cell: data => TextUtils.formatNumber(data.value),
      },
    ];
  }

  render() {
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        loading={assetStore.loading.assets}
        itemsCount={assetStore.assetsCount}
        items={assetStore.assets}
        pageSize={uiStore.assetsTable.pageSize}
        curPage={uiStore.assetsTable.curPage}
        tableDataSetter={uiStore.setAssetsTableData.bind(uiStore)}
        topContent={<PageTitle title="Assets" margin={false} />}
      />
    );
  }
}

export default observer(AssetsTable);
