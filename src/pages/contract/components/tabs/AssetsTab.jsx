import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import AssetUtils from '../../../../lib/AssetUtils';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

class AssetsTab extends React.Component {
  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setContractAssetsTableData.bind(uiStore);
  }

  forceReload() {
    this.props.rootStore.uiStore.setContractAssetsTableData({ force: true });
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
    const { contractStore, uiStore } = this.props.rootStore;
    return (
      <TabPanel>
        <ItemsTable
          columns={columns}
          loading={contractStore.loading.assets}
          itemsCount={contractStore.assetsCount}
          items={contractStore.assets}
          pageSize={uiStore.state.contractAssetsTable.pageSize}
          curPage={uiStore.state.contractAssetsTable.curPage}
          tableDataSetter={this.tableDataSetter}
        />
      </TabPanel>
    );
  }
}

AssetsTab.propTypes = {
  rootStore: PropTypes.object,
};

const columns = [
  {
    Header: 'ASSET',
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
    Cell: (data) => AssetUtils.getAmountString(data.original.asset, data.value),
  },
  {
    Header: 'TOTAL ISSUED',
    accessor: 'issued',
    Cell: (data) => AssetUtils.getAmountString(data.original.asset, data.value),
  },
  {
    Header: 'DESTROYED',
    accessor: 'destroyed',
    Cell: (data) => AssetUtils.getAmountString(data.original.asset, data.value),
  },
  {
    Header: 'UNIQUE ADDRESSES',
    accessor: 'keyholders',
    Cell: (data) => TextUtils.formatNumber(data.value),
  },
];

export default inject('rootStore')(
  observer(WithSetIdsOnUiStore(observer(AssetsTab), 'setContractAssetsTableData', ['address']))
);
