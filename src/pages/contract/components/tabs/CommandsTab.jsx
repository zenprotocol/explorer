import React from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import contractStore from '../../../../store/ContractStore';
import uiStore from '../../../../store/UIStore';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const CommandsTab = observer(() => {
  return (
    <TabPanel>
      <ItemsTable
        columns={[
          {
            Header: 'Command',
            accessor: 'command',
            className: 'text-uppercase',
          },
          {
            Header: 'Timestamp',
            accessor: 'Transaction.Block.timestamp',
            minWidth: config.ui.table.minCellWidthDate,
            Cell: data => TextUtils.getDateStringFromTimestamp(data.value),
          },
          {
            Header: 'TX Hash',
            accessor: 'Transaction.hash',
            minWidth: config.ui.table.minCellWidth,
            Cell: data => <HashLink url={`/tx/${data.value}`} hash={data.value} />,
          },
          {
            Header: 'Block',
            accessor: 'Transaction.Block.blockNumber',
            Cell: data => <Link to={`/blocks/${data.value}`}>{data.value}</Link>,
          },
        ]}
        loading={contractStore.loading.commands}
        itemsCount={contractStore.commandsCount}
        items={contractStore.commands}
        pageSize={uiStore.contractCommandsTable.pageSize}
        curPage={uiStore.contractCommandsTable.curPage}
        tableDataSetter={uiStore.setContractCommandsTableData.bind(uiStore)}
        topContent={<div>Total of {contractStore.commandsCount} events found for all commands</div>}
      />
    </TabPanel>
  );
});
export default observer(WithSetIdOnUiStore(CommandsTab, 'setContractCommandsTableData', 'address'));
