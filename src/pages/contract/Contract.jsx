import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Route, Switch, Redirect, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import RouterUtils from '../../lib/RouterUtils';
import TextUtils from '../../lib/TextUtils';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import AssetsBalancesTable from '../../components/AssetsBalancesTable';
import PageTitle from '../../components/PageTitle';
import Page from '../../components/Page';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import { AssetsTab, CodeTab, CommandsTab, TransactionsTab } from './components/tabs';
import './Contract.scss';
import ObjectUtils from '../../lib/ObjectUtils';

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

  componentDidMount() {
    this.setAddress(this.addressProp);
  }

  componentDidUpdate(prevProps) {
    const prevParams = RouterUtils.getRouteParams(prevProps);
    if (this.addressProp !== prevParams.address) {
      this.setAddress(this.addressProp);
    }
  }

  setAddress(address) {
    this.contractStore.loadContract(address);
    this.addressStore.fetchAddress(address);
  }

  render() {
    const is404 = this.contractStore.contract.status === 404;

    return (
      <Page className="Contract">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Contract', this.addressProp)}</title>
        </Helmet>
        <section>
          <PageTitle
            title="Contract"
            subtitle={
              <div>
                <strong>Contract address</strong>:{' '}
                <HashLink hash={this.addressProp} truncate={false} copy={true} />
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
    if (!contract.id) {
      return null;
    }
    const lastActivationBlockNumber = ObjectUtils.getSafeProperty(
      contract,
      'lastActivationTransaction.Block.blockNumber'
    );
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
                <td>CONTRACT ID</td>
                <td>
                  <HashLink hash={contract.id} />
                </td>
              </tr>
              <tr>
                <td>STATUS</td>
                <td>
                  {contract.expiryBlock ? `Active until block ${contract.expiryBlock}` : 'Inactive'}
                </td>
              </tr>
              <tr>
                <td>TRANSACTIONS</td>
                <td>{TextUtils.formatNumber(address.totalTxs)}</td>
              </tr>
              {lastActivationBlockNumber && (
                <tr>
                  <td>LAST ACTIVATION BLOCK</td>
                  <td>
                    <Link to={`/blocks/${lastActivationBlockNumber}`}>
                      {lastActivationBlockNumber}
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="col-lg-6">
          <AssetsBalancesTable
            balance={(address.assetAmounts || []).map(assetAmount => ({
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
            <Route path={`${currentPath}/commands`} component={CommandsTab} />
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
