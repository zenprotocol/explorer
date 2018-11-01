import React from 'react';
import { observer } from 'mobx-react';
import contractStore from '../../../../store/ContractStore';
import uiStore from '../../../../store/UIStore';
import TextUtils from '../../../../lib/TextUtils';
import WithSetAddressOnUiStore from '../WithSetAddressOnUiStore';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const AssetsTab = observer(() => {
  return (
    <TabPanel>
      <ItemsTable
        columns={[
          {
            Header: 'ASSET',
            accessor: 'asset',
            Cell: data => <HashLink hash={data.value} />,
          },
          {
            Header: 'TOKENS OUTSTANDING',
            accessor: 'outstanding',
            Cell: data => TextUtils.formatNumber(data.value),
          },
          {
            Header: 'TOTAL ISSUED',
            accessor: 'issued',
            Cell: data => TextUtils.formatNumber(data.value),
          },
          {
            Header: 'TOKENS DESTROYED',
            accessor: 'destroyed',
            Cell: data => TextUtils.formatNumber(data.value),
          },
          {
            Header: 'UNIQUE KEYHOLDERS',
            accessor: 'keyholders',
            Cell: data => TextUtils.formatNumber(data.value),
          },
        ]}
        loading={contractStore.loading.assets}
        itemsCount={contractStore.assetsCount}
        items={contractStore.assets}
        pageSize={uiStore.contractAssetsTable.pageSize}
        curPage={uiStore.contractAssetsTable.curPage}
        tableDataSetter={uiStore.setContractAssetsTableData.bind(uiStore)}
      />
    </TabPanel>
  );
});
export default observer(
  WithSetAddressOnUiStore(AssetsTab, 'setContractAssetsTableData')
);