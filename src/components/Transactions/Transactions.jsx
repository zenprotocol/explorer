import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Transactions.css';
import TransactionAsset from './Asset/TransactionAsset';

class Transactions extends Component {
  render() {
    const transactions = this.props.transactions;
    if (!transactions || !transactions.length) {
      return null;
    }

    return (
      <section className="bordered border-left border-primary pl-lg-4">
        <h1 className="d-block d-sm-inline-block text-white mb-3 mb-lg-5">Transactions</h1>
        {transactions.map((transaction, index) => {
          return (
            <div className="Transaction" key={transaction.id}>
              <div className="hash mb-4 text-truncate no-text-transform">
                {index === 0 ? (
                  <h5 className="coinbase d-inline-block mr-1 text-white">Coinbase - </h5>
                ) : null}
                <a href="">{transaction.hash}</a>
              </div>
              {transaction.assets.map((asset, assetIndex) => {
                return <TransactionAsset asset={asset} key={assetIndex} />;
              })}
            </div>
          );
        })}
      </section>
    );
  }
}

Transactions.propTypes = {
  transactions: PropTypes.array,
};

export default Transactions;
