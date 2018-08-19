import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import uiStore from '../../store/UIStore';
import blockStore from '../../store/BlockStore';
import BlockUtils from '../../lib/BlockUtils';
import HashLink from '../HashLink/HashLink.jsx';
import ItemsTable from '../ItemsTable/ItemsTable.jsx';

class BlocksTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: 120,
        maxWidth: 120,
        Cell: function(data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        width: 80,
        Cell: data => <Link to={`/blocks/${data.value}`}>{data.value}</Link>,
      },
      {
        Header: 'Parent',
        accessor: 'parent',
        Cell: data => {
          return <HashLink url={`/blocks/${data.original.parent}`} hash={data.value} />;
        },
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
        Cell: function(data) {
          return BlockUtils.formatDifficulty(data.value);
        },
      },
      {
        Header: 'Transactions',
        accessor: 'transactionCount',
      },
    ];
  }

  render() {
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        hideOnMobile={['parent', 'difficulty']}
        loading={blockStore.loading.blocks}
        itemsCount={blockStore.blocksCount}
        items={blockStore.blocks}
        pageSize={uiStore.blocksTable.pageSize}
        curPage={uiStore.blocksTable.curPage}
        tableDataSetter={uiStore.setBlocksTableData.bind(uiStore)}
        title="Blocks"
      />
    );
  }
}

export default observer(BlocksTable);
