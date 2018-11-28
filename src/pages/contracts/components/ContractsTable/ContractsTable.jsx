import React, { Component } from 'react';
import { observer } from 'mobx-react';
import uiStore from '../../../../store/UIStore';
import contractStore from '../../../../store/ContractStore';
import config from '../../../../lib/Config';
import TextUtils from '../../../../lib/TextUtils';
import HashLink from '../../../../components/HashLink';
import ItemsTable from '../../../../components/ItemsTable';
import PageTitle from '../../../../components/PageTitle';

class ContractsTable extends Component {
  getTableColumns() {
    return [
      {
        Header: 'Hash',
        accessor: 'id',
        minWidth: config.ui.table.minCellWidth,
        Cell: (data) => <HashLink url={`/contracts/${data.original.address}`} hash={data.value} />,
      },
      {
        Header: 'Address',
        accessor: 'address',
        minWidth: config.ui.table.minCellWidth,
        Cell: ({value}) => <HashLink url={`/contracts/${value}`} hash={value} />,
      },
      {
        Header: '',
        accessor: 'expiryBlock',
        Cell: ({value}) => value ? 'Active' : 'Inactive',
      },
      {
        Header: 'Active until',
        accessor: 'expiryBlock',
        hideOnMobile: true,
        Cell: ({value}) => value ? `Block #${value}` : '',
      },
      {
        Header: 'Assets Issued',
        accessor: 'assetCount',
        hideOnMobile: true,
        Cell: ({value}) => TextUtils.formatNumber(value),
      },
    ];
  }

  render() {
    return (
      <ItemsTable
        columns={this.getTableColumns()}
        loading={contractStore.loading.contracts}
        itemsCount={contractStore.contractsCount}
        items={contractStore.contracts}
        pageSize={uiStore.contractsTable.pageSize}
        curPage={uiStore.contractsTable.curPage}
        tableDataSetter={uiStore.setContractsTableData.bind(uiStore)}
        topContent={<PageTitle title="Contracts" margin={false} />}
      />
    );
  }
}

export default observer(ContractsTable);
