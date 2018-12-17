import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import { TabPanel } from '../../../../components/tabs';
import ItemsTable from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

const CommandsTab = observer(props => {
  const { contractStore, uiStore } = props.rootStore;
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
        pageSize={uiStore.state.contractCommandsTable.pageSize}
        curPage={uiStore.state.contractCommandsTable.curPage}
        tableDataSetter={uiStore.setContractCommandsTableData.bind(uiStore)}
        topContent={<div>Total of {contractStore.commandsCount} events found for all commands</div>}
      />
    </TabPanel>
  );
});

CommandsTab.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(
  observer(WithSetIdOnUiStore(CommandsTab, 'setContractCommandsTableData', 'address'))
);
