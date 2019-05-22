import React, { Component } from 'react';
import { reaction } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import CommitLink from '../CommitLink';

class VotesTab extends Component {
  componentDidMount() {
    this.reloadOnBlocksCountChange();
  }
  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => {
        this.props.rootStore.uiStore.setRepoVotesTableData({ force: true });
      }
    );
  }
  stopReload() {
    this.forceDisposer();
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
              Cell: data => <CommitLink commitId={data.value} />,
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
              minWidth: config.ui.table.minCellWidth,
              Cell: data => `${TextUtils.formatNumber(data.value)} ZP`,
            },
          ]}
          loading={repoVoteStore.loading.votes}
          itemsCount={repoVoteStore.votesCount}
          items={repoVoteStore.votes}
          pageSize={uiStore.state.repoVotesTable.pageSize}
          curPage={uiStore.state.repoVotesTable.curPage}
          tableDataSetter={uiStore.setRepoVotesTableData.bind(uiStore)}
          topContent={<div>Total votes: {repoVoteStore.votesCount}</div>}
        />
      </TabPanel>
    );
  }
}
export default inject('rootStore')(
  observer(WithSetIdOnUiStore(observer(VotesTab), 'setRepoVotesTableData', 'interval'))
);
