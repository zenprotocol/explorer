import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { reaction } from 'mobx';
import { Helmet } from 'react-helmet';
import RouterUtils from '../../lib/RouterUtils';
import AssetUtils from '../../lib/AssetUtils';
import TextUtils from '../../lib/TextUtils';
import AddressTxsTable from './AddressTxsTable';
import Loading from '../../components/Loading';
import HashLink from '../../components/HashLink';
import ItemNotFound from '../../components/ItemNotFound';
import PageTitle from '../../components/PageTitle';
import AssetsBalancesTable from '../../components/AssetsBalancesTable';
import Page from '../../components/Page';
import './Address.scss';

class AddressPage extends Component {
  componentDidUpdate(prevProps) {
    const params = RouterUtils.getRouteParams(this.props);
    const prevParams = RouterUtils.getRouteParams(prevProps);

    if (params.address !== prevParams.address) {
      this.setAddress(true);
    }
  }

  get uiStore() {
    return this.props.rootStore.uiStore;
  }

  get addressStore() {
    return this.props.rootStore.addressStore;
  }

  get addressProp() {
    return RouterUtils.getRouteParams(this.props).address;
  }

  setAddress(addressChanged) {
    if (addressChanged) {
      this.addressStore.resetAddressTxs(this.addressProp);
    }
    this.addressStore.fetchAddress(this.addressProp);
  }

  componentDidMount() {
    this.setAddress(true);
    this.reloadOnBlocksCountChange();
  }

  componentWillUnmount() {
    this.stopReload();
  }
  reloadOnBlocksCountChange() {
    this.forceDisposer = reaction(
      () => this.props.rootStore.blockStore.blocksCount,
      () => {
        this.setAddress();
      }
    );
  }
  stopReload() {
    this.forceDisposer();
  }

  get is1stTimeLoading() {
    return !Object.keys(this.addressStore.address).length && this.addressStore.loading.address;
  }

  render() {
    const params = RouterUtils.getRouteParams(this.props);
    let zpBalance = (this.addressStore.address.assetAmounts || []).find((x) => x.asset === '00') || {
      balance: 0,
      received: 0,
      sent: 0,
    };
    const is404 = this.addressStore.address.status === 404;
    const renderContent = !is404 && this.addressStore.address.address;

    return (
      <Page className="Address">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Address', params.address)}</title>
        </Helmet>
        <section>
          <PageTitle
            title="ADDRESS"
            subtitle={<HashLink hash={params.address} truncate={false} />}
          />
          {this.is1stTimeLoading && <Loading />}
          {is404 && <ItemNotFound item="address" />}
          {renderContent && (
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
                      <td>BALANCE</td>
                      <td>{AssetUtils.getAmountString('00', zpBalance.balance)}</td>
                    </tr>
                    <tr>
                      <td>TRANSACTIONS</td>
                      <td>{TextUtils.formatNumber(this.addressStore.address.totalTxs)}</td>
                    </tr>
                    <tr>
                      <td>TOTAL RECEIVED</td>
                      <td>{AssetUtils.getAmountString('00', zpBalance.outputSum)}</td>
                    </tr>
                    <tr>
                      <td>TOTAL SENT</td>
                      <td>{AssetUtils.getAmountString('00', zpBalance.inputSum)}</td>
                    </tr>
                    <tr>
                      <td>NO. ASSET TYPES</td>
                      <td>
                        {this.addressStore.address.assetAmounts
                          ? TextUtils.formatNumber(this.addressStore.address.assetAmounts.length)
                          : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-lg-6">
                <AssetsBalancesTable
                  balance={this.addressStore.address.assetAmounts.map((assetAmount) => ({
                    asset: assetAmount.asset,
                    total: assetAmount.balance,
                  }))}
                />
              </div>
            </div>
          )}
        </section>

        <section>{renderContent && <AddressTxsTable address={params.address} />}</section>
      </Page>
    );
  }
}

AddressPage.propTypes = {
  rootStore: PropTypes.object,
};

export default inject('rootStore')(observer(AddressPage));
