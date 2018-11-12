import React, { Component } from 'react';
import { observer } from 'mobx-react';
import addressStore from '../../store/AddressStore';
import uiStore from '../../store/UIStore';
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
import './Address.css';

class AddressPage extends Component {
  componentDidMount() {
    const params = RouterUtils.getRouteParams(this.props);
    this.setAddress(params.address);
  }

  componentDidUpdate(prevProps) {
    const params = RouterUtils.getRouteParams(this.props);
    const prevParams = RouterUtils.getRouteParams(prevProps);

    if (params.address !== prevParams.address) {
      this.setAddress(params.address);
    }
  }

  setAddress(address) {
    uiStore.setAddressTxAssetsTableData({ address });
  }

  render() {
    const params = RouterUtils.getRouteParams(this.props);
    let zpBalance = {
      received: getAssetTotal(addressStore.address.received, '00'),
      sent: getAssetTotal(addressStore.address.sent, '00'),
      balance: getAssetTotal(addressStore.address.balance, '00'),
    };
    const is404 = addressStore.address.status === 404;
    const renderContent = !is404 && addressStore.address.address;

    return (
      <Page className="Address">
        <section>
          <PageTitle
            title="ADDRESS"
            subtitle={<HashLink hash={params.address} truncate={false} />}
          />
          {addressStore.loading.address && <Loading />}
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
                      <td>{TextUtils.formatNumber(addressStore.address.totalTxs)}</td>
                    </tr>
                    <tr>
                      <td>TOTAL RECEIVED</td>
                      <td>{AssetUtils.getAmountString('00', zpBalance.received)}</td>
                    </tr>
                    <tr>
                      <td>TOTAL SENT</td>
                      <td>{AssetUtils.getAmountString('00', zpBalance.sent)}</td>
                    </tr>
                    <tr>
                      <td>NO. ASSET TYPES</td>
                      <td>
                        {addressStore.address.assets ? addressStore.address.assets.length : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-lg-6">
                <AssetsBalancesTable balance={addressStore.address.balance} />
              </div>
            </div>
          )}
        </section>

        <section>{renderContent && <AddressTxsTable address={params.address} />}</section>
      </Page>
    );
  }
}

function getAssetTotal(array, asset) {
  if (array && array.length) {
    for (let i = 0; i < array.length; i++) {
      const element = array[i];
      if (element.asset === asset) {
        return element.total;
      }
    }
  }
  return 0;
}

export default observer(AddressPage);
