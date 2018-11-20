import React, { Component } from 'react';
import { observer } from 'mobx-react';
import assetStore from '../../store/AssetStore';
import AssetsTable from './components/AssetsTable';
import Page from '../../components/Page';

class AssetsPage extends Component {
  componentDidMount() {
    assetStore.loadAssets();
  }

  render() {
    return (
      <Page className="Assets">
        <section>
          <AssetsTable />
        </section>
      </Page>
    );
  }
}

export default observer(AssetsPage);
