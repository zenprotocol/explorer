import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import ContractsTable from './components/ContractsTable';
import Page from '../../components/Page';

class ContractsPage extends Component {
  componentDidMount() {
    this.props.rootStore.contractStore.loadContracts({}, { setItems: false });
  }

  render() {
    return (
      <Page className="Contract">
        <section>
          <ContractsTable />
        </section>
      </Page>
    );
  }
}

ContractsPage.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(ContractsPage));
