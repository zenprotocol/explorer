import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import AssetUtils from '../../../../lib/AssetUtils';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const AssetsTab = observer(props => {
  const { contractStore, uiStore } = props.rootStore;
  return (
    <TabPanel>
      <ItemsTable
        columns={[
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
        ]}
        loading={contractStore.loading.assets}
        itemsCount={contractStore.assetsCount}
        items={contractStore.assets}
        pageSize={uiStore.state.contractAssetsTable.pageSize}
        curPage={uiStore.state.contractAssetsTable.curPage}
        tableDataSetter={uiStore.setContractAssetsTableData.bind(uiStore)}
      />
    </TabPanel>
  );
});

AssetsTab.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(
  observer(WithSetIdOnUiStore(AssetsTab, 'setContractAssetsTableData', 'address'))
);
