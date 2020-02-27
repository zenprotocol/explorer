import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import CommitLink from '../CommitLink';

class ResultsTab extends Component {
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
      15000
    );
  }
  render() {
    const uiStore = this.props.rootStore.uiStore;
    const repoVoteStore = this.props.rootStore.repoVoteStore;
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
