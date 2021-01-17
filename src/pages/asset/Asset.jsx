import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Route, Switch, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import AssetUtils from '../../lib/AssetUtils';
import ObjectUtils from '../../lib/ObjectUtils';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import PageTitle from '../../components/PageTitle';
import Page from '../../components/Page';
import { ChartLoader } from '../../components/charts';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import { TransactionsTab, ChartTab, KeyholdersTab } from './components/tabs';

class AssetPage extends Component {
  get assetStore() {
    return this.props.rootStore.assetStore;
  }

  get is1stTimeLoading() {
    return !Object.keys(this.assetStore.asset).length && this.assetStore.loading.asset;
  }

  componentDidUpdate(prevProps) {
    const prevParams = RouterUtils.getRouteParams(prevProps);
    if (this.assetProp !== prevParams.asset) {
      this.setAsset(this.assetProp);
    }
  }

  setAsset(asset) {
    this.assetStore.loadAsset(asset);
    this.assetStore.loadAssetDistributionData(asset);
  }

  get assetProp() {
    return RouterUtils.getRouteParams(this.props).asset;
  }

  componentDidMount() {
    this.setAsset(this.assetProp);
    this.reloadOnBlocksCountChange();
  }

  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => {
        this.setAsset(this.assetProp);
      }
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  render() {
    if (this.is1stTimeLoading) {
      return <Loading />;
    }

    const is404 = this.assetStore.asset.status === 404;
    const assetName = AssetUtils.getAssetNameFromCode(this.assetProp);
    const contractName = ObjectUtils.getSafeProp(this.assetStore, 'asset.contract.metadata.shortName');

    return (
      <Page className="Asset">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Asset', assetName)}</title>
        </Helmet>
        <section>
          <PageTitle
            title={`Asset${contractName ? ' of ' + contractName : ''}`}
            subtitle={
              <HashLink hash={assetName} value={this.assetProp} truncate={false} copy={true} />
            }
          />
          {is404 ? <ItemNotFound item="asset" /> : this.renderTopTables()}
        </section>
        {!is404 && <section>{this.renderTabs()}</section>}
      </Page>
    );
  }

  renderTopTables() {
    if (this.is1stTimeLoading) {
      return null;
    }
    const asset = this.assetStore.asset;
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
              {!AssetUtils.isZP(asset.asset) && (
                <>
                <tr>
                  <td>CONTRACT ID</td>
                  <td>
                    <HashLink hash={contract.id} url={`/contracts/${contract.address}`} />
                  </td>
                </tr>
                <tr>
                  <td>SUBTYPE</td>
                  <td>
                    <HashLink hash={asset.subType} />
                  </td>
                </tr>
                </>
              )}
              <tr>
                <td>TOKENS OUTSTANDING</td>
                <td>
                  {AssetUtils.getAmountString(
                    this.assetStore.asset.asset,
                    this.assetStore.asset.outstanding
                  )}
                </td>
              </tr>
              <tr>
                <td>TOTAL ISSUED</td>
                <td>
                  {AssetUtils.getAmountString(
                    this.assetStore.asset.asset,
                    this.assetStore.asset.issued
                  )}
                </td>
              </tr>
              <tr>
                <td>DESTROYED</td>
                <td>
                  {AssetUtils.getAmountString(
                    this.assetStore.asset.asset,
                    this.assetStore.asset.destroyed
                  )}
                </td>
              </tr>
              <tr>
                <td>UNIQUE ADDRESSES</td>
                <td>{TextUtils.formatNumber(this.assetStore.asset.keyholders)}</td>
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
            chartName={asset.asset === '00' ? 'zpRichList' : 'assetDistributionMap'}
            showTitle={false}
            params={{ asset: this.assetProp }}
            externalChartData={this.assetStore.assetDistributionData.data}
            externalChartLoading={this.assetStore.assetDistributionData.loading}
          />
        </div>
      </div>
    );
  }

  renderTabs() {
    if (this.is1stTimeLoading) {
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

AssetPage.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(AssetPage));
