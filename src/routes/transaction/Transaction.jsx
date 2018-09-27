import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import blockStore from '../../store/BlockStore';
import TextUtils from '../../lib/TextUtils';
import Transaction from '../../components/Transactions/Transaction.jsx';
import Loading from '../../components/Loading/Loading.jsx';
import './Transaction.css';

class TransactionPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hash: '',
      polling: false,
    };
  }

  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    this.setState({ hash: Number(params.hash) });
    blockStore.fetchTransaction(params.hash).then(transaction => {
      if (!transaction) {
        // In case the tx is new and will be included soon in a block
        this.setState({ polling: true });
        this.pollForTx(params.hash);
      }
    });
  }

  componentWillUnmount() {
    clearTimeout(this.txPollingTimeout);
  }

  pollForTx(hash) {
    clearTimeout(this.txPollingTimeout);
    this.txPollingTimeout = setTimeout(() => {
      blockStore.fetchTransaction(hash).then(transaction => {
        if (!transaction) {
          this.pollForTx(hash);
        } else {
          this.setState({ polling: false });
        }
      });
    }, 10000);
  }

  render() {
    const transaction = blockStore.transaction;

    if (blockStore.loading.transaction && !this.state.polling) {
      return <Loading />;
    }

    if (!transaction) {
      return <NotFoundDisplay />;
    }

    const blockDateStr = transaction.Block.timestamp
      ? TextUtils.getDateStringFromTimestamp(transaction.Block.timestamp)
      : '';

    return (
      <div className="Transaction">
        <section>
          <div className="row">
            <div className="col-sm">
              <div className="medianTime mb-1 mb-lg-2">{blockDateStr}</div>
              <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transaction</h1>
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
                    <td>Block</td>
                    <td>
                      <Link to={`/blocks/${transaction.Block.blockNumber}`}>
                        {transaction.Block.blockNumber}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td>Confirmations</td>
                    <td className="no-text-transform">
                      {blockStore.confirmations(transaction.Block.blockNumber)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <Transaction transaction={transaction} disableTXLinks={true} />
        </section>
      </div>
    );
  }
}

TransactionPage.propTypes = {
  match: PropTypes.object,
};

const NotFoundDisplay = () => {
  return (
    <div className="Transaction not-found">
      <section>
        <h1 className="text-center">No Tx found yet.</h1>
        <Loading text="" />
      </section>
    </div>
  );
};

export default observer(TransactionPage);
