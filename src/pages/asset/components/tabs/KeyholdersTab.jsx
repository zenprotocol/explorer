import React from 'react';
import { observer, inject } from 'mobx-react';
import config from '../../../../lib/Config';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import AssetUtils from '../../../../lib/AssetUtils';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const KeyholdersTab = observer((props) => {
  const assetStore = props.rootStore.assetStore;
  const uiStore = props.rootStore.uiStore;
  const totalIssued = Number(assetStore.asset.issued || 0);
  return (
    <TabPanel>
      <ItemsTable
        columns={[
          {
            Header: 'RANK',
            Cell: data => data.index + 1 + (data.page * data.pageSize),
          },
          {
            Header: 'ADDRESS',
            accessor: 'address',
            minWidth: config.ui.table.minCellWidth,
            Cell: data => <HashLink url={`/address/${data.value}`} hash={data.value} />,
          },
          {
            Header: 'QUANTITY',
            accessor: 'balance',
            Cell: data => AssetUtils.getAmountString(uiStore.state.assetKeyholdersTable.asset, data.value),
          },
          {
            Header: '%',
            accessor: 'balance',
            Cell: ({value}) => {
              return (totalIssued ? Number(value) / totalIssued * 100 : 0) + '%';
            },
          },
        ]}
        loading={assetStore.loading.assetKeyholders}
        itemsCount={assetStore.assetKeyholdersCount}
        items={assetStore.assetKeyholders}
        pageSize={uiStore.state.assetKeyholdersTable.pageSize}
        curPage={uiStore.state.assetKeyholdersTable.curPage}
        tableDataSetter={uiStore.setAssetKeyholdersTableData.bind(uiStore)}
        topContent={
          <div>{assetStore.assetKeyholdersCount} unique keyholders found for this asset</div>
        }
      />
    </TabPanel>
  );
});
export default inject('rootStore')(observer(WithSetIdOnUiStore(KeyholdersTab, 'setAssetKeyholdersTableData', 'asset')));
