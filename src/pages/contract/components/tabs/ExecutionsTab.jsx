import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';

class ExecutionsTab extends React.Component {
  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setContractExecutionsTableData.bind(uiStore);
  }

  forceReload() {
    this.props.rootStore.uiStore.setContractExecutionsTableData({ force: true });
  }

  componentDidMount() {
    this.reloadOnBlocksCountChange();
  }
  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    // autorun was reacting to unknown properties, use reaction instead
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => this.forceReload()
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  render() {
    const { contractStore, uiStore } = this.props.rootStore;
    return (
      <TabPanel>
        <ItemsTable
          columns={columns}
          loading={contractStore.loading.executions}
          itemsCount={contractStore.executionsCount}
          items={contractStore.executions}
          pageSize={uiStore.state.contractExecutionsTable.pageSize}
          curPage={uiStore.state.contractExecutionsTable.curPage}
          tableDataSetter={uiStore.setContractExecutionsTableData.bind(uiStore)}
          topContent={
            <div>
              Total of {TextUtils.formatNumber(contractStore.executionsCount)} events found for all
              executions
            </div>
          }
        />
      </TabPanel>
    );
  }
}

ExecutionsTab.propTypes = {
  rootStore: PropTypes.object,
};

const columns = [
  {
    Header: 'Command',
    accessor: 'command',
    className: 'text-uppercase',
    Cell: ({ value }) => <HashLink hash={value} />,
  },
  {
    Header: 'Timestamp',
    accessor: 'timestamp',
    minWidth: config.ui.table.minCellWidthDate,
    Cell: ({ value }) => TextUtils.getDateStringFromTimestamp(value),
  },
  {
    Header: 'TX Hash',
    accessor: 'txHash',
    minWidth: config.ui.table.minCellWidth,
    Cell: ({ value }) => <HashLink url={`/tx/${value}`} hash={value} />,
  },
  {
    Header: 'Block',
    accessor: 'blockNumber',
    Cell: ({ value }) => <Link to={`/blocks/${value}`}>{TextUtils.formatNumber(value)}</Link>,
  },
];

export default inject('rootStore')(
  observer(
    WithSetIdsOnUiStore(
      observer(ExecutionsTab),
      'setContractExecutionsTableData',
      ['address'],
      true
    )
  )
);
