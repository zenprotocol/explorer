import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import Config from '../../../../lib/Config';
import AssetUtils from '../../../../lib/AssetUtils';
import TextUtils from '../../../../lib/TextUtils';
import HashLink from '../../../../components/HashLink';
import { ItemsTableWithUrlPagination } from '../../../../components/ItemsTable';
import PageTitle from '../../../../components/PageTitle';

class AssetsTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Asset Identifier',
        accessor: 'asset',
        minWidth: Config.ui.table.minCellWidth,
        Cell: ({ value }) => (
          <HashLink
            hash={AssetUtils.getAssetNameFromCode(value)}
            value={value}
            url={`/assets/${value}`}
          />
        ),
      },
      {
        Header: 'tokens outstanding',
        accessor: 'outstanding',
        Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
      },
      {
        Header: 'total issued',
        accessor: 'issued',
        Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
      },
      {
        Header: 'destroyed',
        accessor: 'destroyed',
        Cell: data => AssetUtils.getAmountString(data.original.asset, data.value),
      },
      {
        Header: 'unique addresses',
        accessor: 'keyholders',
        Cell: data => TextUtils.formatNumber(data.value),
      },
      {
        Header: 'txs',
        accessor: 'transactionsCount',
        Cell: data => TextUtils.formatNumber(data.value),
      },
    ];
  }

  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setAssetsTableData.bind(uiStore);
  }

  render() {
    const { assetStore, uiStore } = this.props.rootStore;
    return (
      <ItemsTableWithUrlPagination
        location={this.props.location} 
        history={this.props.history}
        columns={this.getTableColumns()}
        loading={assetStore.loading.assets}
        itemsCount={assetStore.assetsCount}
        items={assetStore.assets}
        pageSize={uiStore.state.assetsTable.pageSize}
        curPage={uiStore.state.assetsTable.curPage}
        tableDataSetter={this.tableDataSetter}
        dataTable={uiStore.state.assetsTable}
        topContent={<PageTitle title="Assets" margin={false} />}
      />
    );
  }
}

AssetsTable.propTypes = {
  rootStore: PropTypes.object,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default inject('rootStore')(observer(AssetsTable));
