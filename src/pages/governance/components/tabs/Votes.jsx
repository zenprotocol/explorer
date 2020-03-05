import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import CommitLink from '../CommitLink';

class VotesTab extends Component {
  componentDidMount() {
    this.poll();
  }
  componentWillUnmount() {
    clearInterval(this.fetchInterval);
  }
  poll() {
    this.fetchInterval = setInterval(
      () => this.props.rootStore.uiStore.setRepoVotesTableData({ force: true }),
      30000
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
              Header: 'Timestamp',
              accessor: 'timestamp',
              minWidth: config.ui.table.minCellWidthDate,
              Cell: ({ value }) => TextUtils.getDateStringFromTimestamp(value),
            },
            {
              Header: 'TX HASH',
              accessor: 'txHash',
              minWidth: config.ui.table.minCellWidth,
              Cell: ({ value }) => <HashLink url={`/tx/${value}`} hash={value} />,
            },
            {
              Header: 'Block',
              accessor: 'blockNumber',
              Cell: ({ value }) => (
                <Link to={`/blocks/${value}`}>{TextUtils.formatNumber(value)}</Link>
              ),
            },
            {
              Header: 'VOTES',
              accessor: 'zpAmount',
              minWidth: config.ui.table.minCellWidth,
              Cell: ({ value }) => `${TextUtils.formatNumber(value)} ZP`,
            },
          ]}
          loading={repoVoteStore.loading.votes}
          itemsCount={repoVoteStore.votesCount}
          items={repoVoteStore.votes}
          pageSize={uiStore.state.repoVotesTable.pageSize}
          curPage={uiStore.state.repoVotesTable.curPage}
          tableDataSetter={uiStore.setRepoVotesTableData.bind(uiStore)}
          topContent={<div>Total votes: {TextUtils.formatNumber(repoVoteStore.votesCount)}</div>}
        />
      </TabPanel>
    );
  }
}
export default inject('rootStore')(
  observer(
    WithSetIdsOnUiStore(observer(VotesTab), 'setRepoVotesTableData', ['interval', 'phase'], true)
  )
);
