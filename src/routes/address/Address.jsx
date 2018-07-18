import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import RouterUtils from '../../lib/RouterUtils';
import Transactions from '../../components/Transactions/Transactions.jsx';

class AddressPage extends Component {
  componentDidMount() {
    const params = RouterUtils.getRouteParams(this.props);
    // TODO - get some info about the address
  }

  render() {
    const params = RouterUtils.getRouteParams(this.props);
    return (
      <div className="Address">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <div className="medianTime mb-1 mb-lg-2"></div>
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">ADDRESS</h1>
            </div>
          </div>
          <div className="row">
            <div className="col">
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
                    <td>Address</td>
                    <td>{params.address}</td>
                  </tr>
                  <tr>
                    <td>transactions</td>
                    <td>{blockStore.transactionsCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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

export default observer(AddressPage);
