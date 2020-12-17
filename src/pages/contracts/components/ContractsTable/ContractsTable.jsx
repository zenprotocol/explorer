import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Link } from 'react-router-dom';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import ObjectUtils from '../../../../lib/ObjectUtils';
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
        Cell: (data) => (
          <HashLink
            url={`/contracts/${data.original.address}`}
            hash={ObjectUtils.getSafeProp(data, 'original.metadata.shortName')}
            value={data.value}
            truncate={false}
          />
        ),
      },
      {
        Header: 'Address',
        accessor: 'address',
        minWidth: config.ui.table.minCellWidth,
        Cell: ({ value }) => <HashLink url={`/contracts/${value}`} hash={value} />,
      },
      {
        Header: 'Activation',
        accessor: 'lastActivationBlock',
        minWidth: config.ui.table.minCellWidth,
        sortable: true,
        hideOnMobile: true,
        Cell: ({ value }) => <Link to={`/blocks/${value}`}>{TextUtils.formatNumber(value)}</Link>,
      },
      {
        Header: 'Active until',
        accessor: 'expiryBlock',
        minWidth: config.ui.table.minCellWidth,
        sortable: true,
        Cell: ({ value }) => (value ? TextUtils.formatNumber(value) : 'Inactive'),
      },
      {
        Header: 'Txs',
        accessor: 'txsCount',
        minWidth: config.ui.table.minCellWidth,
        sortable: true,
        hideOnMobile: true,
        Cell: ({ value }) => TextUtils.formatNumber(value),
      },
      {
        Header: 'Assets Issued',
        accessor: 'assetsIssued',
        minWidth: config.ui.table.minCellWidth,
        hideOnMobile: true,
        Cell: ({ value }) => TextUtils.formatNumber(value),
      },
    ];
  }

  forceReload() {
    this.props.rootStore.uiStore.setContractsTableData({ force: true });
  }

  componentDidMount() {
    this.forceReload();
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
        defaultSorted={[{ id: 'lastActivationBlock', desc: true }]}
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
