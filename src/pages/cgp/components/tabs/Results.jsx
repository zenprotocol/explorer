import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import classNames from 'classnames';
import {Decimal} from 'decimal.js';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import AddressLink from '../../../../components/AddressLink';
import getTableSubComponent from './getTableSubComponent';
import percentageToZP from '../../../../lib/rewardPercentageToZP';

class ResultsTab extends Component {
  constructor(props) {
    super(props);
    this.getTrProps = this.getTrProps.bind(this);
  }
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
          ? uiStore.setCGPNominationResultsTableData({ force: true })
          : this.typeParam === 'payout'
          ? uiStore.setCGPPayoutResultsTableData({ force: true })
          : uiStore.setCGPAllocationResultsTableData({ force: true }),
      30000
    );
  }
  getTrProps(state, rowInfo, column, instance, trProps) {
    if(!rowInfo || !rowInfo.original) return {};

    const { cgpStore } = this.props.rootStore;

    return {
      ...trProps,
      className: classNames(trProps.className, {
        'above-threshold':
          this.typeParam === 'nomination' &&
          new Decimal(rowInfo.original.amount || -1).gte(cgpStore.relevantInterval.threshold || 0),
      }),
    };
  }
  render() {
    const { uiStore, cgpStore, blockStore } = this.props.rootStore;
    const isPayout = this.typeParam === 'payout';
    const isNomination = this.typeParam === 'nomination';
    const isAllocation = this.typeParam === 'allocation';
    const cgpStoreObject = isNomination
      ? cgpStore.resultsNomination
      : isPayout
      ? cgpStore.resultsPayout
      : cgpStore.resultsAllocation;
    const uiStoreTable = isNomination
      ? uiStore.state.cgpNominationResultsTable
      : isPayout
      ? uiStore.state.cgpPayoutResultsTable
      : uiStore.state.cgpAllocationResultsTable;
    const uiStoreTableSetter = isNomination
      ? uiStore.setCGPNominationResultsTableData.bind(uiStore)
      : isPayout
      ? uiStore.setCGPPayoutResultsTableData.bind(uiStore)
      : uiStore.setCGPAllocationResultsTableData.bind(uiStore);

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
              Header: 'VOTES',
              accessor: 'zpAmount',
              minWidth: config.ui.table.minCellWidth,
              Cell: data => `${TextUtils.formatNumber(data.value)} ZP`,
            },
            {
              Header: 'ABOVE THRESHOLD',
              accessor: 'amount',
              minWidth: config.ui.table.minCellWidth,
              show: isNomination,
              Cell: ({value}) => isNomination && new Decimal(value || -1).gte(cgpStore.relevantInterval.threshold || 0) ? 'YES' : 'NO',
            },
          ]}
          loading={cgpStore.loading.results}
          itemsCount={cgpStoreObject.count}
          items={cgpStoreObject.items}
          pageSize={uiStoreTable.pageSize}
          curPage={uiStoreTable.curPage}
          tableDataSetter={uiStoreTableSetter}
          topContent={<div>Total Ballots: {cgpStoreObject.count}</div>}
          SubComponent={getTableSubComponent(this.typeParam)}
          getTrProps={this.getTrProps}
        />
      </TabPanel>
    );
  }
}

export default inject('rootStore')(
  observer(
    WithSetIdsOnUiStore(observer(ResultsTab), 'setCGPVoteResultsTablesData', [
      'interval',
      'phase',
      'type',
    ])
  )
);
