import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Route, Switch, Redirect } from 'react-router-dom';
import contractStore from '../../store/ContractStore';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import AssetUtils from '../../lib/AssetUtils';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import PageTitle from '../../components/PageTitle';
import Page from '../../components/Page';
import { ChartLoader } from '../../components/charts';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import { TransactionsTab, ChartTab, KeyholdersTab } from './components/tabs';

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
    contractStore.loadAssetDistributionData(asset);
  }

  get assetProp() {
    return RouterUtils.getRouteParams(this.props).asset;
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
          {is404 ? <ItemNotFound item="asset" /> : this.renderTopTables()}
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
    const contract = asset.contract || {};
    if (!Object.keys(asset).length) {
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
                  <HashLink hash={contract.id} url={`/contract/${contract.address}`} />
                </td>
              </tr>
              <tr>
                <td>TOKENS OUTSTANDING</td>
                <td>{AssetUtils.getAmountString(contractStore.asset.asset, contractStore.asset.outstanding)}</td>
              </tr>
              <tr>
                <td>TOTAL ISSUED</td>
                <td>{AssetUtils.getAmountString(contractStore.asset.asset, contractStore.asset.issued)}</td>
              </tr>
              <tr>
                <td>DESTROYED</td>
                <td>{AssetUtils.getAmountString(contractStore.asset.asset, contractStore.asset.destroyed)}</td>
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
            externalChartData={contractStore.assetDistributionData.data}
            externalChartLoading={contractStore.assetDistributionData.loading}
          />
        </div>
      </div>
    );
  }

  renderTabs() {
    if (!Object.keys(contractStore.asset)) {
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
            <Route path={`${currentPath}/keyholders`} component={KeyholdersTab} />
            <Route path={`${currentPath}/chart`} component={ChartTab} />
            <Redirect from={`${currentPath}`} to={`${currentPath}/txns`} />
          </Switch>
        </TabBody>
      </Tabs>
    );
  }
}

export default observer(AssetPage);
