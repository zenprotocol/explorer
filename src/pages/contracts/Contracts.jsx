import React, { Component } from 'react';
import { observer } from 'mobx-react';
import ContractsTable from './components/ContractsTable';
import Page from '../../components/Page';

class ContractsPage extends Component {
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

export default observer(ContractsPage);
