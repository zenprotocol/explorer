import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import WithSetIdsOnUiStore from '../../../components/hoc/WithSetIdsOnUiStore';
import config from '../../../lib/Config';
import TextUtils from '../../../lib/TextUtils';
import HashLink from '../../../components/HashLink';
import { ItemsTable } from '../../../components/ItemsTable';
import PageTitle from '../../../components/PageTitle';
import { TransactionAssetLoader } from '../../../components/Transactions';

class AddressTxsTable extends Component {
  get uiStore() {
    return this.props.rootStore.uiStore;
  }
  get addressStore() {
    return this.props.rootStore.addressStore;
  }

  getTableColumns() {
    return [
      {
        Header: 'TX HASH',
        accessor: 'hash',
        minWidth: config.ui.table.minCellWidth,
        Cell: (data) => {
          return <HashLink url={`/tx/${data.value}`} hash={data.value} />;
        },
      },
      {
        Header: 'Timestamp',
        accessor: 'timestamp',
        minWidth: config.ui.table.minCellWidthDate,
        Cell: function (data) {
          return TextUtils.getDateStringFromTimestamp(data.value);
        },
      },
      {
        Header: 'Block',
        accessor: 'blockNumber',
        Cell: (data) => {
          return <Link to={`/blocks/${data.value}`}>{TextUtils.formatNumber(data.value)}</Link>;
        },
      },
      {
        Header: '',
        accessor: 'isCoinbase',
        hideOnMobile: true,
        Cell: (data) => {
          return data.value ? 'Coinbase' : '';
        },
      },
    ];
  }

  get tableDataSetter() {
    return this.uiStore.setAddressTxsTableData.bind(this.uiStore);
  }

  forceReload() {
    this.props.rootStore.uiStore.setAddressTxsTableData({ force: true });
  }

  componentDidMount() {
    this.reloadOnBlocksCountChange();
  }
  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    // autorun was reacting to unknown properties, use reaction instead
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => this.forceReload()
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  render() {
    const address = this.props.address;
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        loading={this.addressStore.loading.addressTxs}
        itemsCount={this.addressStore.addressTxsCount}
        items={this.addressStore.addressTxs}
        pageSize={this.uiStore.state.addressTxsTable.pageSize}
        curPage={this.uiStore.state.addressTxsTable.curPage}
        tableDataSetter={this.tableDataSetter}
        topContent={<PageTitle title="Transactions" margin={false} />}
        SubComponent={(row) => {
          const addressFoundIn = [];
          if (address) {
            Number(row.original.outputSum) !== 0 && addressFoundIn.push('output');
            Number(row.original.inputSum) !== 0 && addressFoundIn.push('input');
          }
          return (
            <TransactionAssetLoader
              transactions={this.addressStore.addressTxs}
              index={row.index}
              timestamp={row.original.timestamp}
              address={address}
              addressFoundIn={addressFoundIn}
            />
          );
        }}
      />
    );
  }
}

AddressTxsTable.propTypes = {
  address: PropTypes.string,
  rootStore: PropTypes.object,
};

export default withRouter(
  inject('rootStore')(
    observer(
      WithSetIdsOnUiStore(observer(AddressTxsTable), 'setAddressTxsTableData', ['address'], true)
    )
  )
);
