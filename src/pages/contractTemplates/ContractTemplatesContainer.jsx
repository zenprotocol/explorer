import React, { Component } from 'react';
import { observable, decorate, computed, runInAction, action } from 'mobx';
import { observer } from 'mobx-react';
import service from '../../lib/Service';
import config from '../../lib/Config';
import LocalStoreContainer from '../../components/containers/LocalStoreContainer';
import ContractTemplates from './ContractTemplates.jsx';
import './ContractTemplates.scss';

class ContractTemplatesContainer extends Component {
  constructor(props) {
    super(props);

    this.data = {
      loading: false,
      templates: [],
    };
    this.tableData = {
      pageSize: config.ui.table.defaultPageSize,
      curPage: 0,
    };

    this.setTableData = this.setTableData.bind(this);
  }

  get curPageTableItems() {
    const { curPage, pageSize } = this.tableData;
    const { templates } = this.data;
    return templates.slice(curPage * pageSize, (curPage + 1) * pageSize);
  }

  get tableItemsCount() {
    return this.data.templates.length;
  }

  setTableData(data = {}) {
    Object.keys(data).forEach(key => {
      this.tableData[key] = data[key];
    });
  }

  componentDidMount() {
    this.data.loading = true;
    service.contractTemplates
      .findAll()
      .then(response => {
        runInAction(() => {
          this.data.templates = response.data;
        });
      })
      .catch(() => {})
      .then(() => {
        runInAction(() => {
          this.data.loading = false;
        });
      });
  }

  render() {
    return (
      <React.Fragment>
        <LocalStoreContainer name="contract-templates" data={this.tableData} keys={['pageSize']} />
        <ContractTemplates
          loading={this.data.loading}
          itemsCount={this.tableItemsCount}
          items={this.curPageTableItems}
          pageSize={this.tableData.pageSize}
          curPage={this.tableData.curPage}
          tableDataSetter={this.setTableData}
        />
      </React.Fragment>
    );
  }
}
decorate(ContractTemplatesContainer, {
  data: observable,
  tableData: observable,
  curPageTableItems: computed,
  tableItemsCount: computed,
  setTableData: action,
});

export default observer(ContractTemplatesContainer);
