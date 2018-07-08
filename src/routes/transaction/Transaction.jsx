import React, { Component } from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import Transactions from '../../components/Transactions/Transactions.jsx';
import './Transaction.css';

class Transaction extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hash: '',
    };
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    this.setState({ hash: Number(params.hash) });
    blockStore.fetchTransaction(params.hash);
  }

  render() {
    const transaction = blockStore.transaction;
    const medianTime = blockStore.medianTimeString;

    if(!transaction) {
      return null;
    }

    return (
      <div className="Transaction">
        <section className="bordered border-left border-primary pl-lg-4">
          <div className="row">
            <div className="col-sm">
              <div className="medianTime mb-1 mb-lg-2">{medianTime}</div>
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">
                Transaction
              </h1>
            </div>
          </div>
          <Transactions transactions={[transaction]} disableTXLinks={true} />
        </section>
      </div>
    );
  }
}

Transaction.propTypes = {
  match: PropTypes.object,
};

export default observer(Transaction);
