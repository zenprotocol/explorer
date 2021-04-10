import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Route, Switch, Redirect, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import ObjectUtils from '../../lib/ObjectUtils';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import AssetsBalancesTable from '../../components/AssetsBalancesTable';
import PageTitle from '../../components/PageTitle';
import Page from '../../components/Page';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import { AssetsTab, CodeTab, ExecutionsTab, TransactionsTab } from './components/tabs';
import './Contract.scss';

class ContractPage extends Component {
  get contractStore() {
    return this.props.rootStore.contractStore;
  }

  get addressStore() {
    return this.props.rootStore.addressStore;
  }

  get addressProp() {
    return RouterUtils.getRouteParams(this.props).address;
  }

  setAddress(address) {
    this.contractStore.loadContract(address);
    this.addressStore.fetchAddress(address);
  }

  componentDidMount() {
    this.setAddress(this.addressProp);
    this.reloadOnBlocksCountChange();
  }

  componentDidUpdate(prevProps) {
    const prevParams = RouterUtils.getRouteParams(prevProps);
    if (this.addressProp !== prevParams.address) {
      this.setAddress(this.addressProp);
    }
  }

  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => {
        this.setAddress(this.addressProp);
      }
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  render() {
    const is404 = this.contractStore.contract.status === 404;
    const { id, metadata } = this.contractStore.contract;

    const shortName = ObjectUtils.getSafeProp(metadata, 'shortName');

    return (
      <Page className="Contract">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Contract', this.addressProp)}</title>
        </Helmet>
        <section>
          <PageTitle
            title={'Contract' + (shortName ? ` - ${shortName}` : '')}
            subtitle={
              <div>
                <div className="mb-1">
                  <strong>Address</strong>:{' '}
                  <HashLink hash={this.addressProp} truncate={false} copy={true} />
                </div>
                <div>
                  <strong>ID</strong>: {id && <HashLink hash={id} truncate={false} />}
                </div>
              </div>
            }
          />
          {is404 ? <ItemNotFound item="contract" /> : this.renderTopTables()}
        </section>
        {!is404 && <section>{this.renderTabs()}</section>}
      </Page>
    );
  }

  renderTopTables() {
    if (this.contractStore.loading.contract || this.addressStore.loading.address) {
      return <Loading />;
    }
    const contract = this.contractStore.contract;
    const address = this.addressStore.address;
    const addressTxsCount = this.addressStore.addressTxsCount;
    if (!contract.id) {
      return null;
    }
    const name = ObjectUtils.getSafeProp(contract, 'metadata.name');

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
              {name ? (
                <tr>
                  <td>FULL NAME</td>
                  <td>{name}</td>
                </tr>
              ) : null}

              <tr>
                <td>STATUS</td>
                <td>
                  {contract.expiryBlock
                    ? `Active until block ${TextUtils.formatNumber(contract.expiryBlock)}`
                    : 'Inactive'}
                </td>
              </tr>
              <tr>
                <td>TRANSACTIONS</td>
                <td>{TextUtils.formatNumber(addressTxsCount)}</td>
              </tr>
              {contract.lastActivationBlock && (
                <tr>
                  <td>LAST ACTIVATION BLOCK</td>
                  <td>
                    <Link to={`/blocks/${contract.lastActivationBlock}`}>
                      {TextUtils.formatNumber(contract.lastActivationBlock)}
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="col-lg-6">
          <AssetsBalancesTable
            balance={(address.assetAmounts || []).map((assetAmount) => ({
              metadata: assetAmount.metadata,
              asset: assetAmount.asset,
              total: assetAmount.balance,
            }))}
          />
        </div>
      </div>
    );
  }

  renderTabs() {
    if (!this.contractStore.contract.id) {
      return null;
    }
    const currentPath = this.props.match.path;
    return (
      <Tabs>
        <TabHead>
          <Tab id="txns">TRANSACTIONS</Tab>
          <Tab id="commands">COMMANDS</Tab>
          <Tab id="code">CONTRACT CODE</Tab>
          <Tab id="assets">ASSETS ISSUED</Tab>
        </TabHead>
        <TabBody>
          <Switch>
            <Route path={`${currentPath}/txns`} component={TransactionsTab} />
            <Route path={`${currentPath}/commands`} component={ExecutionsTab} />
            <Route path={`${currentPath}/code`} component={CodeTab} />
            <Route path={`${currentPath}/assets`} component={AssetsTab} />
            <Redirect from={`${currentPath}`} to={`${currentPath}/txns`} />
          </Switch>
        </TabBody>
      </Tabs>
    );
  }
}

ContractPage.propTypes = {
  match: PropTypes.object,
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(ContractPage));
