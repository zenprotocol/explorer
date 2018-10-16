import React, { Component } from 'react';
import { observable, decorate, computed, runInAction, action, autorun } from 'mobx';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import Service from '../../lib/Service';
import config from '../../lib/Config';
import LocalStoreContainer from '../../components/containers/LocalStoreContainer';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import ItemsTable from '../../components/ItemsTable';
import Button from '../../components/buttons/Button';
import './ContractTemplates.css';

class ContractTemplates extends Component {
  constructor(props) {
    super(props);

    this.data = {
      loading: false,
      templates: [
        {
          id: 1,
          name: 'test 1',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          template: 'sdfdsf',
        },
        {
          id: 2,
          name: 'contract 2',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          template: null,
        },
      ],
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

  render() {
    return (
      <Page className="ContractTemplates">
        <LocalStoreContainer name="contract-templates" data={this.tableData} keys={['pageSize']} />
        <ItemsTable
          columns={[
            {
              Header: 'Contract type',
              accessor: 'name',
              className: 'font-weight-bold text-white',
            },
            {
              Header: 'Description',
              accessor: 'description',
              className: 'description',
            },
            {
              Header: '',
              accessor: 'template',
              className: 'create',
              Cell: data => <CreateButtonWithRouter active={!!data.value} />,
            },
          ]}
          hideOnMobile={['description']}
          loading={this.data.loading}
          itemsCount={this.tableItemsCount}
          items={this.curPageTableItems}
          pageSize={this.tableData.pageSize}
          curPage={this.tableData.curPage}
          tableDataSetter={this.setTableData}
          topContent={<PageTitle title="Contract Templates" margin={false} />}
        />
      </Page>
    );
  }
}
decorate(ContractTemplates, {
  data: observable,
  tableData: observable,
  curPageTableItems: computed,
  tableItemsCount: computed,
  setTableData: action,
});

export default observer(ContractTemplates);

class CreateButton extends Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    const { id, history } = this.props;
    history.push(`/templates/contract/${id}`);
  }

  render() {
    const { active } = this.props;
    const btnProps = active ? {
      onClick: this.handleClick,
      className: 'CreateButton-item',
    } : {
      className: 'CreateButton-item btn-link',
      disabled: true,
    };
    return (
      <div className="CreateButton">
        <Button size="sm" {...btnProps}>
          {active? 'Create' : 'Coming soon'}
        </Button>
      </div>
    );
  }
}
CreateButton.propTypes = {
  id: PropTypes.number,
  active: PropTypes.bool,
  history: PropTypes.any,
};
const CreateButtonWithRouter = withRouter(CreateButton);
