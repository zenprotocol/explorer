import React from 'react';
import { observer, inject } from 'mobx-react';
import config from '../../../../lib/Config';
import WithSetIdOnUiStore from '../../../../components/hoc/WithSetIdOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import CommitLink from '../CommitLink';

const ResultsTab = observer(props => {
  const uiStore = props.rootStore.uiStore;
  const repoVoteStore = props.rootStore.repoVoteStore;
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
            Header: 'VOTES',
            accessor: 'zpAmount',
            minWidth: config.ui.table.minCellWidth,
            Cell: data => `${TextUtils.formatNumber(data.value)} ZP`,
          },
        ]}
        loading={repoVoteStore.loading.results}
        itemsCount={repoVoteStore.resultsCount}
        items={repoVoteStore.results}
        pageSize={uiStore.state.repoVoteResultsTable.pageSize}
        curPage={uiStore.state.repoVoteResultsTable.curPage}
        tableDataSetter={uiStore.setRepoVoteResultsTableData.bind(uiStore)}
        topContent={
          <div>Total commit IDs: {repoVoteStore.resultsCount}</div>
        }
      />
    </TabPanel>
  );
});
export default inject('rootStore')(
  observer(WithSetIdOnUiStore(ResultsTab, 'setRepoVoteResultsTableData', 'interval'))
);
