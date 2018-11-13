import React from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import contractStore from '../../../../store/ContractStore';
import uiStore from '../../../../store/UIStore';
import config from '../../../../lib/Config';
import WithSetIdOnUiStore from '../WithSetIdOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import { TransactionAssetLoader } from '../../../../components/Transactions';

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
            Header: 'Output total',
            accessor: 'outputSum',
            Cell: data => TextUtils.formatNumber(data.value),
          },
        ]}
        loading={contractStore.loading.assetTxs}
        itemsCount={contractStore.assetTxsCount}
        items={contractStore.assetTxs}
        pageSize={uiStore.assetTxsTable.pageSize}
        curPage={uiStore.assetTxsTable.curPage}
        tableDataSetter={uiStore.setAssetTxsTableData.bind(uiStore)}
        topContent={
          <div>Total of {contractStore.assetTxsCount} transactions found involving this asset</div>
        }
        SubComponent={row => {
          return (
            <TransactionAssetLoader
              transactionAssets={contractStore.assetTxs}
              index={row.index}
              total={Number(row.original.totalSum)}
            />
          );
        }}
      />
    </TabPanel>
  );
});
export default observer(WithSetIdOnUiStore(TransactionsTab, 'setAssetTxsTableData', 'asset'));
