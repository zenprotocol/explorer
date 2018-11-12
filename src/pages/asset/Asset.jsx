import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Route, Switch, Redirect } from 'react-router-dom';
import contractStore from '../../store/ContractStore';
import RouterUtils from '../../lib/RouterUtils';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import PageTitle from '../../components/PageTitle';
import Page from '../../components/Page';
import { Tabs, TabHead, TabBody, Tab } from '../../components/tabs';
import { TransactionsTab } from './components/tabs';

class ContractPage extends Component {
  // componentDidMount() {
  //   this.setAddress(this.assetProp);
  // }

  // componentDidUpdate(prevProps) {
  //   const prevParams = RouterUtils.getRouteParams(prevProps);
  //   if (this.assetProp !== prevParams.address) {
  //     this.setAddress(this.assetProp);
  //   }
  // }

  // setAddress(address) {
  //   contractStore.loadContract(address);
  //   addressStore.fetchAddress(address);
  // }

  get assetProp() {
    return RouterUtils.getRouteParams(this.props).asset;
  }

  render() {
    const is404 = contractStore.contract.status === 404;

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
    if (contractStore.loading.contract || contractStore.loading.asset) {
      return <Loading />;
    }
    const contract = contractStore.contract;
    if(!contract.id) {
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
                <td>hash here...</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-lg-6">
          chart here
        </div>
      </div>
    );
  }

  renderTabs() {
    if(!contractStore.contract.id) {
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

export default observer(ContractPage);
