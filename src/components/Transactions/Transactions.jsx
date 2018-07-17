import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import blockStore from '../../store/BlockStore';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';
import './Transactions.css';
import Transaction from './Transaction.jsx';

class Transactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasMoreItems: true,
    };
  }

  componentDidMount() {
    const { blockNumber, address } = this.props;
    let params = { blockNumber, address };
    blockStore.fetchTransactions(params);
  }

  render() {
    const { address, disableTXLinks } = this.props;

    if (!blockStore.transactions.length) {
      return null;
    }
    const loader = <div className="loader">Loading ...</div>;

    const items = blockStore.transactions.map((transaction, index) => {
      return (
        <Transaction
          key={transaction.id}
          transaction={transaction}
          disableTXLinks={disableTXLinks}
          address={address}
        />
      );
    });

    return <div className="Transactions">{items}</div>;
  }
}

Transactions.propTypes = {
  disableTXLinks: PropTypes.bool,
  blockNumber: PropTypes.number,
  address: PropTypes.string,
};

export default observer(Transactions);
