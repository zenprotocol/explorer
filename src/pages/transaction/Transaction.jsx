import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer, inject } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import TextUtils from '../../lib/TextUtils';
import RouterUtils from '../../lib/RouterUtils';
import TransactionAssets from './components/Assets';
import Loading from '../../components/Loading';
import Page from '../../components/Page';
import PageTitle from '../../components/PageTitle';
import HashLink from '../../components/HashLink';
import './Transaction.scss';

class TransactionPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hash: '',
      polling: false,
    };

    this.pollIntervalAddition = 1; // will change over time
  }

  get blockStore() {
    return this.props.rootStore.blockStore;
  }

  get transactionStore() {
    return this.props.rootStore.transactionStore;
  }

  componentDidMount() {
    const { hash } = RouterUtils.getRouteParams(this.props);
    this.setState({ hash: Number(hash) });
    this.transactionStore.fetchTransaction(hash).then(transaction => {
      if (!transaction) {
        // In case the tx is new and will be included soon in a block
        this.setState({ polling: true });
        this.pollForTx(hash);
      }
    });
  }

  componentWillUnmount() {
    clearTimeout(this.txPollingTimeout);
  }

  pollForTx(hash) {
    clearTimeout(this.txPollingTimeout);
    this.txPollingTimeout = setTimeout(() => {
      this.transactionStore.fetchTransaction(hash).then(transaction => {
        if (!transaction) {
          this.pollForTx(hash);
        } else {
          this.setState({ polling: false });
        }
      });
    }, this.getExponentialPollInterval());
  }

  getExponentialPollInterval() {
    const interval = Math.max(this.pollIntervalAddition, 10); // not below 10 seconds
    this.pollIntervalAddition *= 2;
    return interval * 1000;
  }

  render() {
    const transaction = this.transactionStore.transaction;

    if (this.transactionStore.loading.transaction && !this.state.polling) {
      return <Loading />;
    }

    if (!transaction) {
      return <NotFoundDisplay />;
    }

    const confirmations = Math.max(
      0,
      Number(this.blockStore.blocksCount) - Number(transaction.Block.blockNumber) + 1
    );

    return (
      <Page className="Transaction">
        <Helmet>
          <title>{TextUtils.getHtmlTitle('Transaction', transaction.hash)}</title>
        </Helmet>
        <section>
          <PageTitle
            title="TRANSACTION"
            subtitle={<HashLink hash={transaction.hash} truncate={false} />}
          />
          <div className="row">
            <div className="col">
              <table className="table table-zen">
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
                        {TextUtils.formatNumber(transaction.Block.blockNumber)}
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td>Timestamp</td>
                    <td>
                      <span className="timezone">
                        {TextUtils.getDateStringFromTimestamp(transaction.Block.timestamp)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Confirmations</td>
                    <td className="no-text-transform">
                      {TextUtils.formatNumber(confirmations)}
                    </td>
                  </tr>
                  {transaction.isCoinbaseTx && (
                    <tr>
                      <td>Coinbase</td>
                      <td>
                        Maturity:{' '}
                        {getCoinbaseMaturity(
                          this.blockStore.blocksCount,
                          transaction.Block.blockNumber
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <section>
          <TransactionAssets transaction={transaction} disableTXLinks={true} />
        </section>
      </Page>
    );
  }
}

TransactionPage.propTypes = {
  match: PropTypes.object,
  rootStore: PropTypes.object,
};

function getCoinbaseMaturity(latestBlock, txBlock) {
  const difference = Math.min(latestBlock - txBlock, 100);
  return 100 - difference;
}

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

export default inject('rootStore')(observer(TransactionPage));
