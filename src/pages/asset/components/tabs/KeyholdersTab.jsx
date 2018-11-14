import React from 'react';
import { observer } from 'mobx-react';
import contractStore from '../../../../store/ContractStore';
import uiStore from '../../../../store/UIStore';
import config from '../../../../lib/Config';
import WithSetIdOnUiStore from '../WithSetIdOnUiStore';
import AssetUtils from '../../../../lib/AssetUtils';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const KeyholdersTab = observer(() => {
  const totalIssued = Number(contractStore.asset.issued || 0);
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
            Cell: data => AssetUtils.getAmountString(uiStore.assetKeyholdersTable.asset, data.value),
          },
          {
            Header: '%',
            accessor: 'balance',
            Cell: ({value}) => {
              return (totalIssued ? Number(value) / totalIssued * 100 : 0) + '%';
            },
          },
        ]}
        loading={contractStore.loading.assetKeyholders}
        itemsCount={contractStore.assetKeyholdersCount}
        items={contractStore.assetKeyholders}
        pageSize={uiStore.assetKeyholdersTable.pageSize}
        curPage={uiStore.assetKeyholdersTable.curPage}
        tableDataSetter={uiStore.setAssetKeyholdersTableData.bind(uiStore)}
        topContent={
          <div>{contractStore.assetKeyholdersCount} unique keyholders found for this asset</div>
        }
      />
    </TabPanel>
  );
});
export default observer(WithSetIdOnUiStore(KeyholdersTab, 'setAssetKeyholdersTableData', 'asset'));
