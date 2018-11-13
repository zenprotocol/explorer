import React, { Component } from 'react';
import { computed, decorate } from 'mobx';
import { observer } from 'mobx-react';
import { Route, Switch, Redirect } from 'react-router-dom';
import contractStore from '../../store/ContractStore';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import PageTitle from '../../components/PageTitle';
import Page from '../../components/Page';
import { ChartLoader } from '../../components/charts';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import { TransactionsTab } from './components/tabs';

class AssetPage extends Component {
  componentDidMount() {
    this.setAsset(this.assetProp);
  }

  componentDidUpdate(prevProps) {
    const prevParams = RouterUtils.getRouteParams(prevProps);
    if (this.assetProp !== prevParams.asset) {
      this.setAsset(this.assetProp);
    }
  }

  setAsset(asset) {
    contractStore.loadAsset(asset);
  }

  get assetProp() {
    return RouterUtils.getRouteParams(this.props).asset;
  }

  get contractId() {
    return this.assetProp.substring(0, 72);
  }

  render() {
    const is404 = contractStore.asset.status === 404;

    return (
      <Page className="Asset">
        <section>
          <PageTitle
            title="Asset"
            subtitle={<HashLink hash={this.assetProp} truncate={false} copy={true} />}
          />
          {is404 ? <ItemNotFound item="contract" /> : this.renderTopTables()}
        </section>
        {!is404 && <section>{this.renderTabs()}</section>}
      </Page>
    );
  }

  renderTopTables() {
    if (contractStore.loading.asset) {
      return <Loading />;
    }
    const asset = contractStore.asset;
    if (!Object.keys(asset)) {
      return null;
    }
    return (
      <div className="row">
        <div className="col-lg-6">
          <table className="table table-zen">
            <thead>
              <tr>
                <th scope="col" colSpan="2">
                  SUMMARY
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>CONTRACT HASH</td>
                <td>
                  <HashLink hash={this.contractId} />
                </td>
              </tr>
              <tr>
                <td>TOKENS OUTSTANDING</td>
                <td>{TextUtils.formatNumber(contractStore.asset.outstanding)}</td>
              </tr>
              <tr>
                <td>TOTAL ISSUED</td>
                <td>{TextUtils.formatNumber(contractStore.asset.issued)}</td>
              </tr>
              <tr>
                <td>DESTROYED</td>
                <td>{TextUtils.formatNumber(contractStore.asset.destroyed)}</td>
              </tr>
              <tr>
                <td>UNIQUE KEYHOLDERS</td>
                <td>{TextUtils.formatNumber(contractStore.asset.keyholders)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-lg-6">
          <table className="table table-zen">
            <thead>
              <tr>
                <th scope="col">Unique keyholder distribution</th>
              </tr>
            </thead>
          </table>
          <ChartLoader
            chartName="assetDistributionMap"
            showTitle={false}
            params={{ asset: this.assetProp }}
          />
        </div>
      </div>
    );
  }

  renderTabs() {
    if (!contractStore.contract.id) {
      return null;
    }
    const currentPath = this.props.match.path;
    return (
      <Tabs>
        <TabHead>
          <Tab id="txns">TRANSACTIONS</Tab>
          <Tab id="keyholders">KEYHOLDERS</Tab>
          <Tab id="chart">CHART</Tab>
        </TabHead>
        <TabBody>
          <Switch>
            <Route path={`${currentPath}/txns`} component={TransactionsTab} />
            <Redirect from={`${currentPath}`} to={`${currentPath}/txns`} />
          </Switch>
        </TabBody>
      </Tabs>
    );
  }
}

decorate(AssetPage, {
  contractId: computed,
});

export default observer(AssetPage);
