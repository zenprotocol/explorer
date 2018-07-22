import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import RouterUtils from '../../lib/RouterUtils';
import Transactions from '../../components/Transactions/Transactions.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import AssetUtils from '../../lib/AssetUtils';
import HashLink from '../../components/HashLink/HashLink.jsx';
import './Address.css';

class AddressPage extends Component {
  componentDidMount() {
    const params = RouterUtils.getRouteParams(this.props);
    blockStore.fetchAddress(params.address);
  }

  getBalanceTableRows() {
    if (!blockStore.address.balance) return null;

    return blockStore.address.balance.map((assetBalance, index) => {
      return (
        <tr key={index}>
          <td>{AssetUtils.getTypeFromCode(assetBalance.asset)}</td>
          <td>{AssetUtils.getAmountString(assetBalance, assetBalance.total)}</td>
        </tr>
      );
    });
  }

  render() {
    const params = RouterUtils.getRouteParams(this.props);
    let zpBalance = {
      received: getAssetTotal(blockStore.address.received, '00'),
      sent: getAssetTotal(blockStore.address.sent, '00'),
      balance: getAssetTotal(blockStore.address.balance, '00'),
    };
    return (
      <div className="Address">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
                ADDRESS
                <div className="address break-word"><HashLink hash={params.address} /></div>
              </h1>
            </div>
          </div>
          {blockStore.loading.address ? (
            <Loading />
          ) : (
            <div className="row">
              <div className="col-lg-6">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col" colSpan="2" className="text-white border-0">
                        SUMMARY
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>BALANCE</td>
                      <td>{AssetUtils.getAmountString({asset: '00'}, zpBalance.balance)}</td>
                    </tr>
                    <tr>
                      <td>TRANSACTIONS</td>
                      <td>{blockStore.transactionsCount}</td>
                    </tr>
                    <tr>
                      <td>TOTAL RECEIVED</td>
                      <td>{AssetUtils.getAmountString({asset: '00'}, zpBalance.received)}</td>
                    </tr>
                    <tr>
                      <td>TOTAL SENT</td>
                      <td>{AssetUtils.getAmountString({asset: '00'}, zpBalance.sent)}</td>
                    </tr>
                    <tr>
                      <td>NO. ASSET TYPES</td>
                      <td>{blockStore.address.assets ? blockStore.address.assets.length : ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-lg-6">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col" colSpan="2" className="text-white border-0">
                        BALANCES
                      </th>
                    </tr>
                    <tr>
                      <th scope="col" className="text-white border-bottom-0">
                        ASSET
                      </th>
                      <th scope="col" className="text-white border-bottom-0">
                        AMOUNT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.getBalanceTableRows()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transactions</h1>
            </div>
          </div>
          <Transactions address={params.address} />
        </section>
      </div>
    );
  }
}

AddressPage.propTypes = {
  match: PropTypes.object,
};

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
