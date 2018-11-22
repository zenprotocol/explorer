import React, { Component } from 'react';
import { observer } from 'mobx-react';
import contractStore from '../../store/ContractStore';
import ContractsTable from './components/ContractsTable';
import Page from '../../components/Page';

class ContractsPage extends Component {
  componentDidMount() {
    contractStore.loadContracts({}, { setItems: false });
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

export default observer(ContractsPage);
