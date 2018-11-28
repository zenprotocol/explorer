import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import ItemsTable from '../../components/ItemsTable';
import Button from '../../components/buttons/Button';
import './ContractTemplates.scss';

function ContractTemplates({ loading, itemsCount, items, pageSize, curPage, tableDataSetter }) {
  return (
    <Page className="ContractTemplates">
      <section>
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
              hideOnMobile: true,
              className: 'description',
              Cell: data => <p dangerouslySetInnerHTML={{__html: data.value}} />,
            },
            {
              Header: '',
              accessor: 'template',
              className: 'create',
              Cell: data => <CreateButtonWithRouter active={!!data.value} slug={data.original.slug} />,
            },
          ]}
          loading={loading}
          itemsCount={itemsCount}
          items={items}
          pageSize={pageSize}
          curPage={curPage}
          tableDataSetter={tableDataSetter}
          topContent={<PageTitle title="Contract Templates" margin={false} />}
        />
      </section>
    </Page>
  );
}
ContractTemplates.propTypes = {
  loading: PropTypes.bool,
  itemsCount: PropTypes.number,
  items: PropTypes.array,
  pageSize: PropTypes.number,
  curPage: PropTypes.number,
  tableDataSetter: PropTypes.func,
};

export default ContractTemplates;

class CreateButton extends Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    const { slug, history } = this.props;
    history.push(`/templates/contract/${slug}`);
  }

  render() {
    const { active } = this.props;
    const btnProps = active
      ? {
          onClick: this.handleClick,
          className: 'CreateButton-item',
        }
      : {
          className: 'CreateButton-item btn-link',
          disabled: true,
        };
    return (
      <div className="CreateButton">
        <Button size="sm" {...btnProps}>
          {active ? 'Create' : 'Coming soon'}
        </Button>
      </div>
    );
  }
}
CreateButton.propTypes = {
  slug: PropTypes.string,
  active: PropTypes.bool,
  history: PropTypes.any,
};
const CreateButtonWithRouter = withRouter(CreateButton);
