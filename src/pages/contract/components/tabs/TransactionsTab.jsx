import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const TransactionsTab = observer(props => {
  const { addressStore, uiStore } = props.rootStore;
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
            minWidth: config.ui.table.minCellWidthDate,
            Cell: data => TextUtils.getDateStringFromTimestamp(data.value),
          },
          {
            Header: 'Block',
            accessor: 'Block.blockNumber',
            Cell: data => <Link to={`/blocks/${data.value}`}>{data.value}</Link>,
          },
          {
            Header: 'Command',
            accessor: 'firstCommand',
            className: 'text-uppercase',
          },
        ]}
        loading={addressStore.loading.addressTransactions}
        itemsCount={addressStore.addressTransactionsCount}
        items={addressStore.addressTransactions}
        pageSize={uiStore.state.addressTxsTable.pageSize}
        curPage={uiStore.state.addressTxsTable.curPage}
        tableDataSetter={uiStore.setAddressTxsTableData.bind(uiStore)}
        topContent={<div>Total of {addressStore.addressTransactionsCount} transactions found</div>}
      />
    </TabPanel>
  );
});

TransactionsTab.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(
  observer(WithSetIdOnUiStore(TransactionsTab, 'setAddressTxsTableData', 'address'))
);
