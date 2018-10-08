import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Route, Switch, Redirect } from 'react-router-dom';
import classNames from 'classnames';
import contractStore from '../../store/ContractStore';
import blockStore from '../../store/BlockStore';
import uiStore from '../../store/UIStore';
import RouterUtils from '../../lib/RouterUtils';
import AssetUtils from '../../lib/AssetUtils';
import TextUtils from '../../lib/TextUtils';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import AssetsBalancesTable from '../../components/AssetsBalancesTable';
import PageTitle from '../../components/PageTitle';
import { Tabs, TabHead, TabBody, Tab, TabPanel } from '../../components/tabs';

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
    blockStore.fetchAddress(address);
  }

  get addressProp() {
    return RouterUtils.getRouteParams(this.props).address;
  }

  render() {
    const is404 = blockStore.address.status === 404;

    return (
      <div className="Address">
        <section>
          <PageTitle
            title="Contract"
            subtitle={<HashLink hash={this.addressProp} truncate={false} copy={true} />}
          />
          {is404 ? <ItemNotFound item="Contract" /> : this.renderTopTables()}
        </section>
        {!is404 && <section>{this.renderTabs()}</section>}
      </div>
    );
  }

  renderTopTables() {
    if (contractStore.loading.contract || blockStore.loading.address) {
      return <Loading />;
    }
    const contract = contractStore.contract;
    const address = blockStore.address;
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
              {contract.expiryBlock ? (
                <tr>
                  <td>ACTIVE UNTIL</td>
                  <td>Block {contract.expiryBlock}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="2">INACTIVE</td>
                </tr>
              )}
              <tr>
                <td>TRANSACTIONS</td>
                <td>{TextUtils.formatNumber(address.totalTxs)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-lg-6">
          <AssetsBalancesTable balance={address.balance} />
        </div>
      </div>
    );
  }

  renderTabs() {
    const currentPath = this.props.match.path;
    return (
      <Tabs>
        <TabHead>
          <Tab id="txns">TRANSACTIONS</Tab>
          <Tab id="commands">COMMANDS</Tab>
          <Tab id="code">CONTRACT CODE</Tab>
          <Tab id="assets">ASSET ISSUED</Tab>
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

function TransactionsTab(props) {
  return <TabPanel>transactions</TabPanel>;
}

function CommandsTab(props) {
  return <TabPanel>commands</TabPanel>;
}

function CodeTab() {
  if (contractStore.loading.contract) {
    return <Loading />;
  }
  return <TabPanel>{contractStore.contract.code}</TabPanel>;
}

function AssetsTab(props) {
  return <TabPanel>assets</TabPanel>;
}

export default observer(ContractPage);
