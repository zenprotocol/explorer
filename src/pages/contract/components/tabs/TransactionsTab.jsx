import React from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import addressStore from '../../../../store/AddressStore';
import uiStore from '../../../../store/UIStore';
import config from '../../../../lib/Config';
import WithSetAddressOnUiStore from '../WithSetAddressOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const TransactionsTab = observer(() => {
  return (
    <TabPanel>
      <ItemsTable
        columns={[
          {
            Header: 'TX HASH',
            accessor: 'hash',
            minWidth: config.ui.table.minCellWidth,
            Cell: data => <HashLink url={`/tx/${data.value}`} hash={data.value} />,
          },
          {
            Header: 'Timestamp',
            accessor: 'Block.timestamp',
            minWidth: config.ui.table.minCellWidth,
            Cell: data => TextUtils.getDateStringFromTimestamp(data.value),
          },
          {
            Header: 'Block',
            accessor: 'Block.blockNumber',
            Cell: data => <Link to={`/blocks/${data.value}`}>{data.value}</Link>,
          },
          {
            Header: 'First Command',
            accessor: 'firstCommand',
            className: 'text-uppercase',
          },
        ]}
        loading={addressStore.loading.addressTransactions}
        itemsCount={addressStore.addressTransactionsCount}
        items={addressStore.addressTransactions}
        pageSize={uiStore.addressTxsTable.pageSize}
        curPage={uiStore.addressTxsTable.curPage}
        tableDataSetter={uiStore.setAddressTxsTableData.bind(uiStore)}
      />
    </TabPanel>
  );
});
export default observer(WithSetAddressOnUiStore(TransactionsTab, 'setAddressTxsTableData'));