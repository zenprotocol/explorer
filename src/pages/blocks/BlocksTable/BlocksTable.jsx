import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { reaction } from 'mobx';
import { Decimal } from 'decimal.js';
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
        sortable: true,
        Cell: function (data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        minWidth: 110,
        sortable: true,
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
        minWidth: 130,
        hideOnMobile: true,
        Cell: ({ value }) => TextUtils.formatNumber(value),
      },
      {
        Header: 'Txs',
        accessor: 'txsCount',
        sortable: true,
        Cell: ({ value }) => TextUtils.formatNumber(value),
      },
      {
        Header: 'Fees',
        accessor: '',
        minWidth: config.ui.table.minCellWidth,
        Cell: (data) =>
          `${AssetUtils.getAmountDivided(
              this.dataFees(data)
          )} ZP`,
      },
      // {
      //   Header: 'Allocation',
      //   accessor: 'allocationAmount',
      //   minWidth: config.ui.table.minCellWidth,
      //   Cell: ({ value }) => AssetUtils.getAmountDivided(value),
      // },
      {
        Header: 'Reward',
        accessor: 'reward',
        minWidth: config.ui.table.minCellWidth,
        Cell: ({ value }) => `${AssetUtils.getAmountDivided(value)} ZP`,
      },
    ];
  }

  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setBlocksTableData.bind(uiStore);
  }
  
  dataFees(data) {
    const total = new Decimal(data.original.coinbaseAmount)
        .plus(data.original.allocationAmount)
        .minus(data.original.reward)
        .toFixed(8);
    return data.original.blockNumber > 1 ? total : '0';
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
        defaultSorted={[{ id: 'blockNumber', desc: true }]}
        defaultSortDesc={true}
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
