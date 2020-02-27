import React from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import AssetUtils from '../../../../lib/AssetUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import { TransactionAssetLoader } from '../../../../components/Transactions';

const TransactionsTab = observer(props => {
  const uiStore = props.rootStore.uiStore;
  const assetStore = props.rootStore.assetStore;
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
            accessor: 'timestamp',
            minWidth: config.ui.table.minCellWidthDate,
            Cell: data => TextUtils.getDateStringFromTimestamp(data.value),
          },
          {
            Header: 'Block',
            accessor: 'blockNumber',
            Cell: data => <Link to={`/blocks/${data.value}`}>{TextUtils.formatNumber(data.value)}</Link>,
          },
          {
            Header: 'Output total',
            accessor: 'outputSum',
            Cell: data => AssetUtils.getAmountString(uiStore.state.assetTxsTable.asset, data.value),
          },
        ]}
        loading={assetStore.loading.assetTxs}
        itemsCount={assetStore.assetTxsCount}
        items={assetStore.assetTxs}
        pageSize={uiStore.state.assetTxsTable.pageSize}
        curPage={uiStore.state.assetTxsTable.curPage}
        tableDataSetter={uiStore.setAssetTxsTableData.bind(uiStore)}
        topContent={
          <div>Total of {TextUtils.formatNumber(assetStore.assetTxsCount)} transactions found involving this asset</div>
        }
        SubComponent={row => {
          return (
            <TransactionAssetLoader transactionAssets={assetStore.assetTxs} index={row.index} />
          );
        }}
      />
    </TabPanel>
  );
});
export default inject('rootStore')(
  observer(WithSetIdsOnUiStore(TransactionsTab, 'setAssetTxsTableData', ['asset']))
);
