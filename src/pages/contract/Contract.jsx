import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Route, Switch, Redirect } from 'react-router-dom';
import contractStore from '../../store/ContractStore';
import addressStore from '../../store/AddressStore';
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

class ContractPage extends Component {
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
    contractStore.loadContract(address);
    addressStore.fetchAddress(address);
  }

  get addressProp() {
    return RouterUtils.getRouteParams(this.props).address;
  }

  render() {
    const is404 = contractStore.contract.status === 404;

    return (
      <Page className="Contract">
        <section>
          <PageTitle
            title="Contract"
            subtitle={<div><strong>Contract address</strong>: <HashLink hash={this.addressProp} truncate={false} copy={true} /></div>}
          />
          {is404 ? <ItemNotFound item="contract" /> : this.renderTopTables()}
        </section>
        {!is404 && <section>{this.renderTabs()}</section>}
      </Page>
    );
  }

  renderTopTables() {
    if (contractStore.loading.contract || addressStore.loading.address) {
      return <Loading />;
    }
    const contract = contractStore.contract;
    const address = addressStore.address;
    if (!contract.id) {
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
                <td>CONTRACT ID</td>
                <td><HashLink hash={contract.id} /></td>
              </tr>
              <tr>
                <td>STATUS</td>
                <td>{contract.expiryBlock ? `Active until block ${contract.expiryBlock}` : 'Inactive'}</td>
              </tr>
              <tr>
                <td>TRANSACTIONS</td>
                <td>{TextUtils.formatNumber(address.totalTxs)}</td>
              </tr>
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
    if (!contractStore.contract.id) {
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

export default observer(ContractPage);
