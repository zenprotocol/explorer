/* eslint-disable react/display-name */
import React from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import WithSetIdsOnUiStore from '../../../../components/hoc/WithSetIdsOnUiStore';
import TextUtils from '../../../../lib/TextUtils';
import { TabPanel } from '../../../../components/tabs';
import { ItemsTable } from '../../../../components/ItemsTable';
import HashLink from '../../../../components/HashLink';
import { TransactionAssetLoader } from '../../../../components/Transactions';

class TransactionsTab extends React.Component {
  get tableDataSetter() {
    const { uiStore } = this.props.rootStore;
    return uiStore.setAddressTxsTableData.bind(uiStore);
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
    const { addressStore, uiStore } = this.props.rootStore;
    return (
      <TabPanel>
        <ItemsTable
          columns={columns}
          loading={addressStore.loading.addressTxs}
          itemsCount={addressStore.addressTxsCount}
          items={addressStore.addressTxs}
          pageSize={uiStore.state.addressTxsTable.pageSize}
          curPage={uiStore.state.addressTxsTable.curPage}
          tableDataSetter={this.tableDataSetter}
          topContent={
            <div>
              Total of {TextUtils.formatNumber(addressStore.addressTxsCount)} transactions found
            </div>
          }
          SubComponent={(row) => {
            return (
              <TransactionAssetLoader
                transactions={addressStore.addressTxs}
                index={row.index}
              />
            );
          }}
        />
      </TabPanel>
    );
  }
}

TransactionsTab.propTypes = {
  rootStore: PropTypes.object,
};

const columns = [
  {
    Header: 'TX HASH',
    accessor: 'hash',
    minWidth: config.ui.table.minCellWidth,
    Cell: ({ value }) => <HashLink url={`/tx/${value}`} hash={value} />,
  },
  {
    Header: 'Timestamp',
    accessor: 'timestamp',
    minWidth: config.ui.table.minCellWidthDate,
    Cell: ({ value }) => TextUtils.getDateStringFromTimestamp(value),
  },
  {
    Header: 'Block',
    accessor: 'blockNumber',
    Cell: ({ value }) => <Link to={`/blocks/${value}`}>{TextUtils.formatNumber(value)}</Link>,
  },
];

export default inject('rootStore')(
  observer(
    WithSetIdsOnUiStore(observer(TransactionsTab), 'setAddressTxsTableData', ['address'], true)
  )
);
