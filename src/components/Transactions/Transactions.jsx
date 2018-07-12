import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './Transactions.css';
import TransactionAsset from './Asset/TransactionAsset';

class Transactions extends Component {
  render() {
    const { transactions, disableTXLinks } = this.props;

    if (!transactions || !transactions.length) {
      return null;
    }
    return (
      <div className="Transactions">
        {transactions.map((transaction, index) => {
          return (
            <div className="Transaction" key={transaction.id}>
              <div className="hash mb-4 text-truncate no-text-transform">
                {transaction.isCoinbase ? (
                  <h5 className="coinbase d-inline-block mr-1 text-white">Coinbase - </h5>
                ) : null}
                {disableTXLinks ? (
                  transaction.hash
                ) : (
                  <Link to={`/tx/${transaction.hash}`}>{transaction.hash}</Link>
                )}
              </div>
              <div className="assets">
                {transaction.assets &&
                  transaction.assets.length &&
                  transaction.assets.map((asset, assetIndex) => {
                    return <TransactionAsset asset={asset} key={assetIndex} />;
                  })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

Transactions.propTypes = {
  transactions: PropTypes.array,
  disableTXLinks: PropTypes.bool,
  isCoinbase: PropTypes.bool,
};

export default Transactions;
