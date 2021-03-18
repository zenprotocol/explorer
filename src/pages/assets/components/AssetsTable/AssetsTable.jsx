import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
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
        Header: 'Asset',
        accessor: '',
        minWidth: 200,
        Cell: ({ value }) => (
          <HashLink
            hash={value.metadata ? value.metadata.shortName : AssetUtils.getAssetNameFromCode(value.asset)}
            value={value.asset}
            url={`/assets/${value.asset}`}
            truncate={!value.metadata}
          />
        ),
      },
      {
        Header: 'Contract',
        accessor: 'contract',
        Cell: ({ value }) => value.id ? (
          <HashLink truncate={false} hash={value.metadata.shortName} value={value.id} url={`/contracts/${value.address}`} />
        ) : null,
      },
      {
        Header: 'tokens outstanding',
        accessor: 'outstanding',
        minWidth: 150,
        Cell: (data) => AssetUtils.getAmountDivided(data.value),
      },
      {
        Header: 'unique addresses',
        accessor: 'keyholders',
        sortable: true,
        minWidth: Config.ui.table.minCellWidth,
        Cell: (data) => TextUtils.formatNumber(data.value),
        hideOnMobile: true,
      },
      {
        Header: 'txs',
        accessor: 'txsCount',
        sortable: true,
        Cell: (data) => TextUtils.formatNumber(data.value),
        hideOnMobile: true,
      },
    ];
  }

  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setAssetsTableData.bind(uiStore);
  }

  forceReload() {
    this.props.rootStore.uiStore.setAssetsTableData({ force: true });
  }

  componentDidMount() {
    this.forceReload();
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
