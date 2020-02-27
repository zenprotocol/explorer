import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
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
            Cell: ({ value }) => <HashLink hash={value} />,
          },
          {
            Header: 'Timestamp',
            accessor: 'Transaction.Block.timestamp',
            minWidth: config.ui.table.minCellWidthDate,
            Cell: ({ value }) => TextUtils.getDateStringFromTimestamp(value),
          },
          {
            Header: 'TX Hash',
            accessor: 'Transaction.hash',
            minWidth: config.ui.table.minCellWidth,
            Cell: ({ value }) => <HashLink url={`/tx/${value}`} hash={value} />,
          },
          {
            Header: 'Block',
            accessor: 'Transaction.Block.blockNumber',
            Cell: ({ value }) => (
              <Link to={`/blocks/${value}`}>{TextUtils.formatNumber(value)}</Link>
            ),
          },
        ]}
        loading={contractStore.loading.commands}
        itemsCount={contractStore.commandsCount}
        items={contractStore.commands}
        pageSize={uiStore.state.contractCommandsTable.pageSize}
        curPage={uiStore.state.contractCommandsTable.curPage}
        tableDataSetter={uiStore.setContractCommandsTableData.bind(uiStore)}
        topContent={
          <div>
            Total of {TextUtils.formatNumber(contractStore.commandsCount)} events found for all
            commands
          </div>
        }
      />
    </TabPanel>
  );
});

CommandsTab.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(
  observer(WithSetIdsOnUiStore(CommandsTab, 'setContractCommandsTableData', ['address']))
);
