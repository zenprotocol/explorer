import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import AddressLink from '../../../../components/AddressLink';
import getTableSubComponent from './getTableSubComponent';
import percentageToZP from '../../../../lib/rewardPercentageToZP';

class VotesTab extends Component {
  get typeParam() {
    return String(this.props.match.params.type).toLowerCase();
  }
  componentDidMount() {
    this.poll();
  }
  componentWillUnmount() {
    clearInterval(this.fetchInterval);
  }
  poll() {
    const { uiStore } = this.props.rootStore;
    this.fetchInterval = setInterval(
      () =>
        this.typeParam === 'nomination'
          ? uiStore.setCGPNominationVotesTableData({ force: true })
          : this.typeParam === 'payout'
          ? uiStore.setCGPPayoutVotesTableData({ force: true })
          : uiStore.setCGPAllocationVotesTableData({ force: true }),
      30000
    );
  }
  render() {
    const { uiStore, cgpStore, blockStore } = this.props.rootStore;
    const isPayout = this.typeParam === 'payout';
    const isNomination = this.typeParam === 'nomination';
    const isAllocation = this.typeParam === 'allocation';
    const cgpStoreObject = isNomination
      ? cgpStore.votesNomination
      : isPayout
      ? cgpStore.votesPayout
      : cgpStore.votesAllocation;
    const uiStoreTable = isNomination
      ? uiStore.state.cgpNominationVotesTable
      : isPayout
      ? uiStore.state.cgpPayoutVotesTable
      : uiStore.state.cgpAllocationVotesTable;
    const uiStoreTableSetter = isNomination
      ? uiStore.setCGPNominationVotesTableData.bind(uiStore)
      : isPayout
      ? uiStore.setCGPPayoutVotesTableData.bind(uiStore)
      : uiStore.setCGPAllocationVotesTableData.bind(uiStore);
    return (
      <TabPanel>
        <ItemsTable
          columns={[
            {
              Header: 'BALLOT',
              accessor: 'ballot',
              minWidth: config.ui.table.minCellWidth,
              Cell: data => <HashLink hash={data.value} copy={true} />,
            },
            {
              Header: 'ALLOCATION',
              accessor: 'content.allocation',
              minWidth: config.ui.table.minCellWidth,
              show: isAllocation,
              Cell: data =>
                `${percentageToZP({ percentage: data.value, height: blockStore.blocksCount })} ZP`,
            },
            {
              Header: 'RECIPIENT',
              accessor: 'content.recipient.address',
              minWidth: config.ui.table.minCellWidth,
              show: !isAllocation,
              Cell: data => <AddressLink address={data.value} hash={data.value} />,
            },
            {
              Header: 'Timestamp',
              accessor: 'timestamp',
              minWidth: config.ui.table.minCellWidthDate,
              Cell: data => TextUtils.getDateStringFromTimestamp(data.value),
            },
            {
              Header: 'TX HASH',
              accessor: 'txHash',
              minWidth: config.ui.table.minCellWidth,
              Cell: data => <HashLink url={`/tx/${data.value}`} hash={data.value} />,
            },
            {
              Header: 'Block',
              accessor: 'blockNumber',
              Cell: data => <Link to={`/blocks/${data.value}`}>{data.value}</Link>,
            },
            {
              Header: 'VOTES',
              accessor: 'zpAmount',
              minWidth: config.ui.table.minCellWidthDate,
              Cell: data => `${TextUtils.formatNumber(data.value)} ZP`,
            },
          ]}
          loading={cgpStore.loading.votes}
          itemsCount={cgpStoreObject.count}
          items={cgpStoreObject.items}
          pageSize={uiStoreTable.pageSize}
          curPage={uiStoreTable.curPage}
          tableDataSetter={uiStoreTableSetter}
          topContent={<div>Total votes: {cgpStoreObject.count}</div>}
          SubComponent={getTableSubComponent(this.typeParam)}
        />
      </TabPanel>
    );
  }
}
export default inject('rootStore')(
  observer(
    WithSetIdsOnUiStore(
      observer(VotesTab),
      'setCgpVotesTablesData',
      ['interval', 'phase', 'type'],
      true
    )
  )
);
