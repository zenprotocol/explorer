import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import config from '../../../lib/Config';
import TextUtils from '../../../lib/TextUtils';
import ObjectUtils from '../../../lib/ObjectUtils';
import HashLink from '../../../components/HashLink';
import { ItemsTable } from '../../../components/ItemsTable';
import PageTitle from '../../../components/PageTitle';

class BlockContractsTable extends Component {
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
        Header: 'Active until',
        accessor: 'expiryBlock',
        sortable: true,
        Cell: ({ value }) => (value ? TextUtils.formatNumber(value) : 'Inactive'),
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
      {
        Header: 'Activation',
        accessor: 'lastActivationBlock',
        sortable: true,
        hideOnMobile: true,
        Cell: ({ value }) => <Link to={`/blocks/${value}`}>{value}</Link>,
      },
    ];
  }
  render() {
    const { blockStore, uiStore } = this.props.rootStore;
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        loading={blockStore.loading.blockContracts}
        itemsCount={blockStore.blockContractsCount}
        items={blockStore.blockContracts}
        pageSize={uiStore.state.blockContractsTable.pageSize}
        curPage={uiStore.state.blockContractsTable.curPage}
        tableDataSetter={uiStore.setBlockContractsTableData.bind(uiStore)}
        topContent={<PageTitle title="Contracts" margin={false} />}
        defaultSorted={[{ id: 'expiryBlock', desc: true }]}
        defaultSortDesc={true}
      />
    );
  }
}

BlockContractsTable.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(BlockContractsTable));
