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
import {
  getPrice,
  getRedeemableEODTimestamp, getRedeemableEODTimestampHigh,
  getRedeemablePositionData,
  getRedeemablePriceData,
  getRedeemableTickerData
} from './NamingUtils';
const { Address, ContractId, PublicKey } = require('@zen/zenjs');

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
    const assetName = ObjectUtils.getSafeProp(
      this.assetStore,
      'asset.metadata.name'
    );
    const contractName = ObjectUtils.getSafeProp(
      this.assetStore,
      'asset.contract.metadata.shortName'
    );
    const id = this.assetStore.asset.asset;

    return (
      <Page className="Asset">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Asset', assetName)}</title>
        </Helmet>
        <section>
          <PageTitle
            title={`Asset${contractName ? ' of ' + contractName : ''}`}
            subtitle={
              <div>
                {assetName &&<div className="mb-1">
                  <strong>Name</strong>:{' '}
                  <HashLink hash={assetName} truncate={false} copy={true} />
                </div>}
                <div>
                  <strong>ID:</strong> {id && <HashLink hash={id} truncate={false} />}
                </div>
              </div>
              
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
    const assetName = ObjectUtils.getSafeProp(
      this.assetStore,
      'asset.metadata.name'
    );
    const assetMisc = ObjectUtils.getSafeProp(
      this.assetStore,
      'asset.metadata.misc'
    );
    
    const chain = ObjectUtils.getSafeProp(
      this.props.rootStore.infoStore.infos,
      'chain'
    );
    const start = assetName && getRedeemableEODTimestamp(assetName);
    const ticker = assetName && getRedeemableTickerData(assetName);
    const position = assetName && getRedeemablePositionData(assetName);
    const price = assetName && getRedeemablePriceData(assetName);
    const expiry = assetName && getRedeemableEODTimestampHigh(assetName);
    const oracleAddress = assetName && PublicKey.fromString(assetMisc.oraclePK).toAddress(chain);
    const oraclePK = assetName && assetMisc.oraclePK;
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
                <td>{AssetUtils.getAmountDivided(this.assetStore.asset.outstanding)}</td>
              </tr>
              <tr>
                <td>TOTAL ISSUED</td>
                <td>{AssetUtils.getAmountDivided(this.assetStore.asset.issued)}</td>
              </tr>
              <tr>
                <td>DESTROYED</td>
                <td>{AssetUtils.getAmountDivided(this.assetStore.asset.destroyed)}</td>
              </tr>
              <tr>
                <td>UNIQUE ADDRESSES</td>
                <td>{TextUtils.formatNumber(this.assetStore.asset.keyholders)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {!assetName && <div className="col-lg-6">
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
        </div>}
        {assetName && <div className="col-lg-6">
          <table className="table table-zen" >
            <thead>
            <tr>
              <th scope="col" colSpan="2">Asset Name Metadata</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>EVENT {expiry ? 'START' : ''}</td>
              <td>{TextUtils.getDateStringFromTimestamp(start)}</td>
            </tr>
            {expiry ? <tr>
              <td>EVENT END</td>
              <td>{TextUtils.getDateStringFromTimestamp(expiry)}</td>
            </tr> : null}
            <tr>
              <td>TICKER</td>
              <td>{ticker}</td>
            </tr>
            <tr>
              <td>POSITION</td>
              <td>{position}</td>
            </tr>
            <tr>
              <td>PRICE</td>
              <td>$ {getPrice(price)}</td>
            </tr>
            <tr>
              <td>COLLATERAL</td>
              <td>{AssetUtils.getAssetNameFromCode(assetMisc.collateral)}</td>
            </tr>
            <tr>
              <td>ORACLE SERVICE PROVIDER</td>
              <td>
                <HashLink hash={oracleAddress} url={`/address/${oracleAddress}`} />
              </td>
            </tr>
            <tr>
              <td>ORACLE PK</td>
              <td>
                <HashLink hash={oraclePK} />
              </td>
            </tr>
            <tr>
              <td>ORACLE CID</td>
              <td>
                <HashLink hash={assetMisc.oracleCID} url={`/contracts/${Address.getPublicKeyHashAddress(chain, ContractId.fromString(assetMisc.oracleCID))}`} />
              </td>
            </tr>
            </tbody>
          </table>
        </div>}
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
          <Tab id="chart">DISTRIBUTION</Tab>
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
