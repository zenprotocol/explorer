import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Decimal } from 'decimal.js';
import classNames from 'classnames';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import CommitLink from '../CommitLink';

class ResultsTab extends Component {
  constructor() {
    super();
    this.getTrProps = this.getTrProps.bind(this);
  }
  get phaseParam() {
    return String(this.props.match.params.phase).toLowerCase();
  }
  componentDidMount() {
    this.poll();
  }
  componentWillUnmount() {
    clearInterval(this.fetchInterval);
  }
  poll() {
    this.fetchInterval = setInterval(
      () =>
        this.props.rootStore.uiStore.setRepoVoteResultsTableData({
          force: true,
        }),
      30000
    );
  }
  getTrProps(state, rowInfo, column, instance, trProps) {
    if (!rowInfo || !rowInfo.original) return {};

    const { repoVoteStore } = this.props.rootStore;

    return {
      ...trProps,
      className: classNames(trProps.className, {
        'above-threshold': new Decimal(rowInfo.original.amount || -1).gte(
          repoVoteStore.relevantInterval.threshold || 0
        ),
      }),
    };
  }
  render() {
    const uiStore = this.props.rootStore.uiStore;
    const repoVoteStore = this.props.rootStore.repoVoteStore;
    const isContestant = this.phaseParam === 'contestant';
    return (
      <TabPanel>
        <ItemsTable
          columns={[
            {
              Header: 'COMMIT ID',
              accessor: 'commitId',
              minWidth: config.ui.table.minCellWidth,
              Cell: ({ value }) => <CommitLink commitId={value} />,
            },
            {
              Header: 'VOTES',
              accessor: 'zpAmount',
              minWidth: config.ui.table.minCellWidth,
              Cell: ({ value }) => `${TextUtils.formatNumber(value)} ZP`,
            },
            {
              Header: 'ABOVE THRESHOLD',
              accessor: 'amount',
              minWidth: config.ui.table.minCellWidth,
              show: isContestant,
              Cell: ({ value }) =>
                isContestant &&
                new Decimal(value || -1).gte(repoVoteStore.relevantInterval.threshold || 0)
                  ? 'YES'
                  : 'NO',
            },
          ]}
          loading={repoVoteStore.loading.results}
          itemsCount={repoVoteStore.resultsCount}
          items={repoVoteStore.results}
          pageSize={uiStore.state.repoVoteResultsTable.pageSize}
          curPage={uiStore.state.repoVoteResultsTable.curPage}
          tableDataSetter={uiStore.setRepoVoteResultsTableData.bind(uiStore)}
          topContent={
            <div>Total commit IDs: {TextUtils.formatNumber(repoVoteStore.resultsCount)}</div>
          }
          getTrProps={this.getTrProps}
        />
      </TabPanel>
    );
  }
}

export default inject('rootStore')(
  observer(
    WithSetIdsOnUiStore(
      observer(ResultsTab),
      'setRepoVoteResultsTableData',
      ['interval', 'phase'],
      true
    )
  )
);
