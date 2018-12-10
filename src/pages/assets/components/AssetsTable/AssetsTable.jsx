import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
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
    const { assetStore, uiStore } = this.props.rootStore;
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        loading={assetStore.loading.assets}
        itemsCount={assetStore.assetsCount}
        items={assetStore.assets}
        pageSize={uiStore.state.assetsTable.pageSize}
        curPage={uiStore.state.assetsTable.curPage}
        tableDataSetter={uiStore.setAssetsTableData.bind(uiStore)}
        topContent={<PageTitle title="Assets" margin={false} />}
      />
    );
  }
}

AssetsTable.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(AssetsTable));
