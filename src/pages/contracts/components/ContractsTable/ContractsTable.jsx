import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import HashLink from '../../../../components/HashLink';
import { ItemsTableWithUrlPagination } from '../../../../components/ItemsTable';
import PageTitle from '../../../../components/PageTitle';

class ContractsTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Name',
        accessor: 'id',
        minWidth: config.ui.table.minCellWidth,
        Cell: data => <HashLink url={`/contracts/${data.original.address}`} hash={data.value} />,
      },
      {
        Header: 'Address',
        accessor: 'address',
        minWidth: config.ui.table.minCellWidth,
        Cell: ({ value }) => <HashLink url={`/contracts/${value}`} hash={value} />,
      },
      {
        Header: 'Status',
        accessor: 'expiryBlock',
        sortable: true,
        Cell: ({ value }) => (value ? `Active until block ${value}` : 'Inactive'),
      },
      {
        Header: 'Txs',
        accessor: 'transactionsCount',
        sortable: true,
        hideOnMobile: true,
        Cell: ({ value }) => TextUtils.formatNumber(value),
      },
      {
        Header: 'Assets Issued',
        accessor: 'assetsCount',
        hideOnMobile: true,
        Cell: ({ value }) => TextUtils.formatNumber(value),
      },
    ];
  }

  render() {
    const { contractStore, uiStore } = this.props.rootStore;
    return (
      <ItemsTableWithUrlPagination
        location={this.props.location} 
        history={this.props.history}
        columns={this.getTableColumns()}
        loading={contractStore.loading.contracts}
        itemsCount={contractStore.contractsCount}
        items={contractStore.contracts}
        pageSize={uiStore.state.contractsTable.pageSize}
        curPage={uiStore.state.contractsTable.curPage}
        tableDataSetter={uiStore.setContractsTableData.bind(uiStore)}
        dataTable={uiStore.state.contractsTable}
        topContent={<PageTitle title="Contracts" margin={false} />}
        defaultSorted={[{ id: 'expiryBlock', desc: true }]}
        defaultSortDesc={true}
      />
    );
  }
}

ContractsTable.propTypes = {
  rootStore: PropTypes.object,
  location: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default inject('rootStore')(observer(ContractsTable));
