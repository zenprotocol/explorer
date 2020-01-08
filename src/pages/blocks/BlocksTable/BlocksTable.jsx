import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { reaction } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import TextUtils from '../../../lib/TextUtils';
import AssetUtils from '../../../lib/AssetUtils';
import config from '../../../lib/Config';
import { ItemsTableWithUrlPagination } from '../../../components/ItemsTable';
import PageTitle from '../../../components/PageTitle';
import HashLink from '../../../components/HashLink';

class BlocksTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: config.ui.table.minCellWidthDate,
        Cell: function(data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        Cell: ({ value }) => <Link to={`/blocks/${value}`}>{TextUtils.formatNumber(value)}</Link>,
      },
      {
        Header: 'Hash',
        accessor: 'hash',
        minWidth: config.ui.table.minCellWidth,
        hideOnMobile: true,
        Cell: ({ value }) => <HashLink url={`/blocks/${value}`} hash={value} />,
      },
      {
        Header: 'Parent',
        accessor: 'parent',
        minWidth: config.ui.table.minCellWidth,
        hideOnMobile: true,
        Cell: ({ value }) => <HashLink url={`/blocks/${value}`} hash={value} />,
      },
      {
        Header: 'Difficulty',
        accessor: 'difficulty',
        hideOnMobile: true,
        Cell: ({ value }) => TextUtils.formatNumber(value),
      },
      {
        Header: 'Txs',
        accessor: 'transactionCount',
        Cell: ({ value }) => TextUtils.formatNumber(value),
      },
      {
        Header: 'Fees',
        accessor: 'coinbaseAmount',
        Cell: data =>
          AssetUtils.getAmountString('00', Number(data.value) - Number(data.original.reward)),
      },
      {
        Header: 'Reward',
        accessor: 'reward',
        Cell: ({ value }) => AssetUtils.getAmountString('00', Number(value)),
      },
    ];
  }

  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setBlocksTableData.bind(uiStore);
  }

  forceBlocksReload() {
    this.props.rootStore.uiStore.setBlocksTableData({ force: true });
  }

  componentDidMount() {
    this.forceBlocksReload();
    this.reloadOnBlocksCountChange();
  }
  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    // autorun was reacting to unknown properties, use reaction instead
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => this.forceBlocksReload()
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  render() {
    const { blockStore, uiStore } = this.props.rootStore;
    return (
      <ItemsTableWithUrlPagination
        location={this.props.location}
        history={this.props.history}
        columns={this.getTableColumns()}
        loading={blockStore.loading.blocks}
        itemsCount={blockStore.blocksCount}
        items={blockStore.blocks}
        pageSize={uiStore.state.blocksTable.pageSize}
        curPage={uiStore.state.blocksTable.curPage}
        tableDataSetter={this.tableDataSetter}
        dataTable={uiStore.state.blocksTable}
        topContent={<PageTitle title="Blocks" margin={false} />}
      />
    );
  }
}

BlocksTable.propTypes = {
  rootStore: PropTypes.object,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default inject('rootStore')(observer(BlocksTable));
